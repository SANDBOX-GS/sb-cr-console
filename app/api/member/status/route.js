export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";
import { cookies } from "next/headers";

/**
 * GET /api/member/status
 * 클라이언트의 로그인 상태(쿠키)를 확인하고 응답합니다.
 * AuthContext에서 호출되며, 쿠키를 통해 member_idx를 검증합니다.
 * @returns 200 OK (로그인 상태) 또는 401 Unauthorized (로그아웃 상태)
 */
export async function GET() {
    let connection;
    try {
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return new Response(JSON.stringify({ message: "No cookie" }), {
                status: 401,
            });
        }

        const member_idx = parseInt(memberIdxCookie.value, 10);
        if (isNaN(member_idx) || member_idx <= 0) {
            return new Response(JSON.stringify({ message: "Invalid ID" }), {
                status: 401,
            });
        }

        connection = await dbConnect();

        const [rows] = await connection.execute(
            `SELECT idx, active_status
             FROM ${TABLE_NAMES.SBN_MEMBER}
             WHERE idx = ?`,
            [member_idx]
        );

        if (rows.length === 0 || rows[0].active_status !== "active") {
            return new Response(JSON.stringify({ message: "User invalid" }), {
                status: 401,
            });
        }

        // 수취인 정보 등록 여부 확인
        const [payeeRows] = await connection.execute(
            `SELECT 1 FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} WHERE member_idx = ? LIMIT 1`,
            [member_idx]
        );

        // 수취인 정보가 있으면 true, 없으면 false
        const hasPayeeInfo = payeeRows.length > 0;

        // 3. 응답에 hasPayeeInfo 포함
        return new Response(
            JSON.stringify({
                message: "Authenticated",
                isLoggedIn: true,
                hasPayeeInfo: hasPayeeInfo, // <--- 이걸 프론트로 보냅니다
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("인증 상태 확인 중 서버 오류 발생:", error);
        return new Response(
            JSON.stringify({
                message: "Server error during authentication check.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (connection) {
            connection.end();
        }
    }
}
