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
      `SELECT file_url, tag, file_realname, file_ext FROM ${TABLE_NAMES.SBN_FILE_INFO} WHERE ref_table_name = ? AND ref_table_idx = ? AND type = ?`,
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

      if (diffDays <= 1 && diffDays >= 0) {
        validityStatus = "expiring_soon";
      } else if (diffDays > 1) {
        validityStatus = "valid";
      }

      validityPeriodEnd = expiredDate.toISOString();
    }

    const metadata = {
      created_at: new Date(payeeRow.created_at).toISOString(),
      updated_at: payeeRow.updated_at
        ? new Date(payeeRow.updated_at).toISOString()
        : new Date(payeeRow.created_at).toISOString(),
      expired_status: validityStatus,
      agree_expired_at: validityPeriodEnd,
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
