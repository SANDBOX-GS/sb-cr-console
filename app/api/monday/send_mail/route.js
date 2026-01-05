export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants"; // 테이블 명이 정의된 상수라고 가정

// UUID 생성 함수
function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

export async function POST(request) {
    try {
        const body = await request.json();

        // [중요] 1. Monday.com 웹훅 등록 인증 (Challenge)
        // Monday에서 웹훅을 처음 연결할 때 challenge라는 값을 보내는데, 이를 그대로 리턴해야 연결이 성사됩니다.
        if (body.challenge) {
            return new Response(JSON.stringify({ challenge: body.challenge }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 2. Monday 데이터 파싱
        // event 객체 안에 정보가 들어있습니다.
        // 보통 '아이템 생성' 트리거를 쓰면 item 이름이 pulseName에 들어옵니다.
        const { event } = body;

        let email = null;

        // 1. columnValues가 있는지 확인
        if (event && event.columnValues) {
            // 우리가 원하는 컬럼 ID (email_mkxszhjr)
            const emailData = event.columnValues.email_mkxszhjr;

            if (emailData) {
                // Case A: 데이터가 객체이고 .email이나 .text 속성이 있는 경우 (가장 흔함)
                if (typeof emailData === "object") {
                    email = emailData.email || emailData.text || null;
                }
                // Case B: 데이터가 그냥 문자열인 경우
                else {
                    email = emailData;
                }
            }
        }

        if (!email) {
            console.log("이메일 정보가 없습니다.", body);
            // 이메일이 없어도 Monday 쪽에는 성공 응답을 보내야 재시도를 안함
            return new Response(JSON.stringify({ message: "No email found" }), {
                status: 200,
            });
        }

        // 3. DB 연결
        const connection = await dbConnect();

        try {
            // 4. 이메일 중복 체크 (이미 존재하는지 확인)
            const [existing] = await connection.execute(
                `SELECT idx FROM ${TABLE_NAMES.SBN_MEMBER} WHERE email = ?`,
                [email]
            );

            if (existing.length > 0) {
                // 이미 존재하면 무시하고 성공 처리 (또는 업데이트 로직 추가 가능)
                return new Response(
                    JSON.stringify({ message: "Email already exists" }),
                    { status: 200 }
                );
            }

            // 5. 데이터 삽입 (inactive 상태로)
            const newUserId = generateUUID();

            // 나머지 컬럼은 DB 기본값(DEFAULT)이 들어가므로,
            // user_id, email, active_status('inactive') 만 명시적으로 넣습니다.
            await connection.execute(
                `INSERT INTO ${TABLE_NAMES.SBN_MEMBER} (user_id, email, active_status) 
                 VALUES (?, ?, 'inactive')`,
                [newUserId, email]
            );

            console.log(
                `[Monday Webhook] 신규 inactive 유저 생성 완료: ${email}`
            );

            return new Response(
                JSON.stringify({ message: "User created successfully" }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                }
            );
        } catch (dbError) {
            console.error("DB Error:", dbError);
            return new Response(JSON.stringify({ message: "Database Error" }), {
                status: 500,
            });
        } finally {
            if (connection) connection.release();
        }
    } catch (error) {
        console.error("Server Error:", error);
        return new Response(JSON.stringify({ message: "Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
