export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8시간

export async function POST(request) {
    const { email, password } = await request.json();
    let connection;

    try {
        connection = await dbConnect();

        // 1. 사용자 정보 조회
        const [rows] = await connection.execute(
            `SELECT idx, password, active_status FROM ${TABLE_NAMES.SBN_MEMBER} WHERE email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "존재하지 않는 이메일입니다. 다시 확인해 주세요." },
                { status: 401 }
            );
        }

        const member = rows[0];

        // 2. 상태 확인
        if (member.active_status !== "active") {
            return NextResponse.json(
                { message: "비활성화된 계정입니다. 계정을 활성화해 주세요." },
                { status: 403 }
            );
        }

        // 3. 비밀번호 비교
        const passwordMatch = await bcrypt.compare(password, member.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: "비밀번호가 일치하지 않습니다. 다시 확인해 주세요." },
                { status: 401 }
            );
        }

        // 4. 수취인 정보 등록 여부 확인
        // 해당 member_idx로 등록된 수취인 정보가 있는지 확인 (LIMIT 1로 존재 여부만 체크)
        const [payeeRows] = await connection.execute(
            `SELECT 1 FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} WHERE member_idx = ? LIMIT 1`,
            [member.idx]
        );

        const hasPayeeInfo = payeeRows.length > 0; // 데이터가 있으면 true, 없으면 false

        // 5. 로그인 성공 및 HTTP-Only 쿠키 발급
        const memberIdxCookie = `member_idx=${member.idx}; Max-Age=${SESSION_MAX_AGE}; Path=/; HttpOnly=true; Secure=true; SameSite=Strict`;

        return new NextResponse(
            JSON.stringify({
                message: "로그인 성공",
                member_idx: member.idx,
                hasPayeeInfo: hasPayeeInfo, // ✅ 프론트엔드로 플래그 전달
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Set-Cookie": memberIdxCookie,
                },
            }
        );
    } catch (error) {
        console.error("로그인 중 서버 오류 발생:", error);

        return NextResponse.json(
            { message: "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
