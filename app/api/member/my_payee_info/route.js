export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const FILE_TYPE_TAG = "PAYEE_DOCUMENT";

export async function GET(req) {
    let connection;

    try {
        // 0. 쿠키에서 member_idx 가져오기
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                { message: "인증 정보가 없습니다. 다시 로그인해 주세요." },
                { status: 401 }
            );
        }

        const memberIdx = parseInt(memberIdxCookie.value, 10);
        if (isNaN(memberIdx) || memberIdx <= 0) {
            return NextResponse.json(
                { message: "유효하지 않은 사용자 ID입니다." },
                { status: 401 }
            );
        }

        // 1. DB 연결
        connection = await dbConnect();

        // 2. 수취인 정보 조회 (가장 최신 1건)

        const [payeeRows] = await connection.query(
            `
    SELECT 
      p.*,
      m.email,
      m.tel
    FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} AS p
    LEFT JOIN ${TABLE_NAMES.SBN_MEMBER} AS m
      ON p.member_idx = m.idx
    WHERE p.member_idx = ?
    ORDER BY p.created_at DESC
    LIMIT 1
  `,
            [memberIdx]
        );
        if (payeeRows.length === 0) {
            return NextResponse.json(
                {
                    payeeData: null,
                    files: {},
                    metadata: null,
                    message: "등록된 수취인 정보가 없습니다.",
                },
                { status: 200 }
            );
        }

        const payeeRow = payeeRows[0];
        const payeeIdx = payeeRow.idx;

        // 3. 파일 정보 조회
        const [fileRows] = await connection.query(
            `SELECT t1.file_url, t1.tag, t1.file_realname, t1.file_ext
             FROM ${TABLE_NAMES.SBN_FILE_INFO} t1
                      INNER JOIN (
                 SELECT tag, MAX(idx) as max_idx
                 FROM ${TABLE_NAMES.SBN_FILE_INFO}
                 WHERE ref_table_name = ?
                   AND ref_table_idx = ?
                   AND type = ?
                 GROUP BY tag
             ) t2 ON t1.idx = t2.max_idx`,
            [TABLE_NAMES.SBN_MEMBER_PAYEE, payeeIdx, FILE_TYPE_TAG]
        );

        const files = fileRows.reduce((acc, file) => {
            acc[file.tag] = {
                url: file.file_url,
                name: file.file_realname,
                ext: file.file_ext,
            };
            return acc;
        }, {});

        // 4. metadata 계산 (snake_case)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiredAtDateStr = payeeRow.agree_expired_at;
        let validityStatus = "expired";
        let validityPeriodEnd = null;

        if (expiredAtDateStr) {
            const expiredDate = new Date(expiredAtDateStr);
            expiredDate.setHours(0, 0, 0, 0);

            const diffTime = expiredDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                // diffDays < 0 : 어제까지였다 (오늘 기준 지남) -> 만료
                validityStatus = "expired";
            } else if (diffDays <= 7) {
                // 0 <= diffDays <= 7 : 오늘 포함 7일 이내 -> 만료임박
                // (오늘 당일도 0이므로 여기 포함됨)
                validityStatus = "expiring_soon";
            } else {
                // diffDays > 7 : 8일 이상 남음 -> 유효
                validityStatus = "valid";
            }

            const year = expiredDate.getFullYear();
            const month = String(expiredDate.getMonth() + 1).padStart(2, "0");
            const day = String(expiredDate.getDate()).padStart(2, "0");
            validityPeriodEnd = `${year}-${month}-${day}`;
        }

        const metadata = {
            created_at: new Date(payeeRow.created_at).toISOString(),
            updated_at: payeeRow.updated_at
                ? new Date(payeeRow.updated_at).toISOString()
                : new Date(payeeRow.created_at).toISOString(),
            expired_status: validityStatus,
            agree_expired_at: validityPeriodEnd,
            approval_status: payeeRow.approval_status,
            processed_at: payeeRow.precessed_at
                ? new Date(payeeRow.precessed_at).toISOString()
                : null,
        };
        // 5. 최종 응답 (데이터는 snake_case 그대로)
        return NextResponse.json(
            {
                payeeData: payeeRow, // DB row 그대로 (snake_case)
                files,
                metadata,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in GET /api/member/payee_info:", error);

        return NextResponse.json(
            {
                message: "서버 오류로 수취인 정보를 불러올 수 없습니다.",
                error: error.message,
            },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
