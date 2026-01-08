export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";
import bcrypt from "bcryptjs";
import { toYn } from "@/utils/formHelpers";

export async function POST(request) {
    const {
        code,
        email,
        password,
        agreed_to_terms,
        agreed_to_privacy,
        agreed_to_marketing,
    } = await request.json();
    let connection;

    try {
        connection = await dbConnect();

        // 1. 이메일 존재 여부 확인 및 상태 조회
        const [rows] = await connection.execute(
            `SELECT user_id, active_status FROM ${TABLE_NAMES.SBN_MEMBER} WHERE email = ?`,
            [email]
        );

        // 이메일이 존재하지 않는 경우
        if (rows.length === 0) {
            return new Response(
                JSON.stringify({ message: "이메일이 존재하지 않습니다." }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        const member = rows[0];

        // code가 없거나 서로 다르면 유효하지 않은 접근으로 처리
        if (!code || member.user_id !== code) {
            return new Response(
                JSON.stringify({
                    message: "유효하지 않은 접근입니다. (잘못된 인증 코드)",
                }),
                { status: 403, headers: { "Content-Type": "application/json" } }
            );
        }

        // 2. active_status 확인
        if (member.active_status === "active") {
            return new Response(
                JSON.stringify({ message: "이미 등록된 계정입니다." }),
                { status: 409, headers: { "Content-Type": "application/json" } }
            );
        }

        // 3. 비밀번호 암호화 및 crip_id 업데이트
        const termsYN = toYn(agreed_to_terms);
        const privacyYN = toYn(agreed_to_privacy);
        const marketingYN = toYn(agreed_to_marketing);
        const thirdPartyYN = "N"; // 정책상 고정이면 그냥 고정
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log(hashedPassword);
        // inactive 계정을 활성화하고 비밀번호, user_id, 동의 정보 업데이트
        await connection.execute(
            `UPDATE ${TABLE_NAMES.SBN_MEMBER} SET
                password = ?,
                agreed_to_terms = ?,
                terms_agreed_at = IF(? = 'Y', NOW(), terms_agreed_at),
                agreed_to_privacy = ?,
                privacy_agreed_at = IF(? = 'Y', NOW(), privacy_agreed_at),
                agreed_to_third_party = 'N',
                third_party_agreed_at = IF(? = 'Y', NOW(), third_party_agreed_at),
                agreed_to_marketing = ?,
                marketing_agreed_at = IF(? = 'Y', NOW(), marketing_agreed_at),
                active_status = 'active',
                updated_at = NOW()
            WHERE email = ? AND user_id = ?`,
            [
                hashedPassword, // 1
                termsYN, // 2
                termsYN, // 3
                privacyYN, // 4
                privacyYN, // 5
                thirdPartyYN, // 6 (항상 N)
                marketingYN, // 7
                marketingYN, // 8
                email, // 9
                code, // 10
            ]
        );
        console.log(Response);
        return new Response(
            JSON.stringify({ message: "계정이 성공적으로 활성화되었습니다." }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("데이터베이스 처리 중 오류 발생:", error);

        return new Response(
            JSON.stringify({ message: "서버 오류가 발생했습니다." }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
