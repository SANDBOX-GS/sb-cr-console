export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";

// POST /api/member/check
export async function POST(request) {
    const { code } = await request.json();
    let connection;

    try {
        connection = await dbConnect();

        // user_id(code)로 멤버 조회
        const [rows] = await connection.execute(
            `SELECT user_id, active_status FROM ${TABLE_NAMES.SBN_MEMBER} WHERE user_id = ?`,
            [code]
        );

        // 1. 코드가 DB에 없는 경우
        if (rows.length === 0) {
            return new Response(
                JSON.stringify({ message: "접속 코드가 유효하지 않습니다. 초대 받은 이메일의 링크로 다시 시도해 주세요." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const member = rows[0];

        // 2. 이미 활성화(active)된 계정인 경우
        if (member.active_status === "active") {
            return new Response(
                JSON.stringify({ message: "이미 등록된 계정입니다. 로그인해 주세요." }),
                { status: 409, headers: { "Content-Type": "application/json" } }
            );
        }

        // 3. 정상 (가입 가능 상태)
        return new Response(
            JSON.stringify({ message: "유효한 코드입니다." }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("코드 확인 중 오류:", error);
        return new Response(
            JSON.stringify({ message: "서버 오류" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (connection) connection.release();
    }
}