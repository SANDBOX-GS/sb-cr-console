export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import {
    TABLE_NAMES,
    NHN_CONFIG,
    MONDAY_API_CONFIG,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS
} from '@/constants/dbConstants';

// [추가] UUID 생성 함수
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==========================================
// 1. 먼데이 상태 업데이트 함수
// ==========================================
async function updateMondayStatus(itemId, labelValue) {
    const columnId = MONDAY_COLUMN_IDS.PAYEE_REQUEST.STATUS;

    const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
        change_simple_column_value (board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
            id
        }
    }`;

    const variables = {
        boardId: parseInt(MONDAY_BOARD_IDS.PAYEE_REQUEST),
        itemId: parseInt(itemId),
        columnId: columnId,
        value: labelValue
    };

    try {
        const response = await fetch(MONDAY_API_CONFIG.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': MONDAY_API_CONFIG.TOKEN
            },
            body: JSON.stringify({ query, variables })
        });

        const result = await response.json();
        if (result.errors) {
            console.error(`❌ Monday Update Error (Item: ${itemId}):`, result.errors);
        } else {
            console.log(`✅ Monday Status Updated: ${itemId} -> ${labelValue}`);
        }
    } catch (e) {
        console.error(`❌ Monday API Error (Item: ${itemId}):`, e);
    }
}

// ==========================================
// 2. NHN 이메일 발송 함수
// ==========================================
async function sendNHNEmail(receiverEmail, receiverName, templateParams) {
    const body = {
        templateId: NHN_CONFIG.EMAIL.TEMPLATE_ID,
        templateParameter: {
            name: receiverName,
            email: receiverEmail,
            ...templateParams
        },
        receiverList: [{
            receiveMailAddr: receiverEmail,
            receiveName: receiverName,
            receiveType: "MRT0"
        }],
        userId: "CR_CONSOLE_USER"
    };

    try {
        const response = await fetch(NHN_CONFIG.EMAIL.AD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Secret-Key': NHN_CONFIG.EMAIL.SECRET_KEY
            },
            body: JSON.stringify(body)
        });
        const result = await response.json();

        if (!result.header.isSuccessful) {
            console.error("❌ Email API Error Details:", JSON.stringify(result, null, 2));
        }

        return result.header.isSuccessful;
    } catch (e) {
        console.error("NHN Email Fetch Error:", e);
        return false;
    }
}

// ==========================================
// 3. NHN 알림톡 발송 함수
// ==========================================
async function sendNHNKakao(receiverPhone, templateParams) {
    const cleanPhone = receiverPhone.replace(/-/g, '');
    const body = {
        senderKey: NHN_CONFIG.KAKAO.SENDER_KEY,
        templateCode: NHN_CONFIG.KAKAO.TEMPLATE_CODE,
        recipientList: [{
            recipientNo: cleanPhone,
            templateParameter: { ...templateParams }
        }]
    };

    try {
        const response = await fetch(NHN_CONFIG.KAKAO.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Secret-Key': NHN_CONFIG.KAKAO.SECRET_KEY
            },
            body: JSON.stringify(body)
        });
        const result = await response.json();

        // [디버깅] 실패했다면 에러 내용을 로그에 출력
        if (!result.header.isSuccessful) {
            console.error("❌ Kakao API Error Details:", JSON.stringify(result, null, 2));
        }

        return result.header.isSuccessful;
    } catch (e) {
        console.error("NHN Kakao Fetch Error:", e);
        return false;
    }
}

// ==========================================
// 4. 메인 로직 (POST)
// ==========================================
export async function POST(request) {
    let connection;

    try {
        connection = await dbConnect();

        // 1. 발송 대상 조회
        const query = `
            SELECT idx, item_id, email, tel, email_state, kakao_state
            FROM ${TABLE_NAMES.SBN_PAYEE_REQUEST}
            WHERE email_state = 'pending' OR kakao_state = 'pending'
        `;

        const [targets] = await connection.execute(query);

        if (targets.length === 0) {
            return new Response(JSON.stringify({ message: '발송 대기중인 건이 없습니다.' }), { status: 200 });
        }

        const now = new Date();
        const currentYear = String(now.getFullYear());
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

        const paymentDateStr = `${currentYear}.${String(now.getMonth() + 2).padStart(2, '0')}.10 예정`;
        const writeDateStr = `${currentYear}년 ${currentMonth}월 ${now.getDate()}일`;
        const writeDetailStr = `${currentYear}년 ${currentMonth}월 귀속 수익`;

        let successCount = 0;

        for (const target of targets) {
            const { idx, item_id, email, tel, email_state, kakao_state } = target;
            const nameAsId = email;

            let updateUpdates = [];
            let mondayStatusToUpdate = null;

            // (A) 이메일 발송
            if (email_state === 'pending') {
                const emailParams = {
                    year: currentYear,
                    month: currentMonth,
                    payment_date: paymentDateStr
                };

                const isSent = await sendNHNEmail(email, nameAsId, emailParams);

                if (isSent) {
                    updateUpdates.push("email_state = 'success'");
                    mondayStatusToUpdate = "발송 성공";
                    console.log(`📧 Email Sent: ${email}`);

                    // 🚩 [추가됨] 이메일 발송 성공 시 회원 자동 등록 로직
                    try {
                        const newUserId = generateUUID();
                        // INSERT IGNORE: 이메일이 이미 존재하면 무시하고 넘어감 (에러 발생 X)
                        await connection.execute(
                            `INSERT IGNORE INTO ${TABLE_NAMES.SBN_MEMBER} 
                            (user_id, email, active_status) 
                            VALUES (?, ?, 'inactive')`,
                            [newUserId, email]
                        );
                        console.log(`👤 Member Auto-Registered (Inactive): ${email}`);
                    } catch (memberErr) {
                        console.error(`⚠️ Member Registration Failed for ${email}:`, memberErr);
                        // 회원 등록 실패해도 메일 발송 성공 처리는 유지
                    }

                } else {
                    updateUpdates.push("email_state = 'fail'");
                    mondayStatusToUpdate = "발송 실패";
                    console.error(`📧 Email Fail: ${email}`);
                }
            }

            // (B) 알림톡 발송
            if (kakao_state === 'pending') {
                if (tel && tel.length > 9) {
                    const kakaoParams = {
                        yyyy: currentYear,
                        mm: currentMonth,
                        write_date: writeDateStr,
                        write_detail: writeDetailStr,
                        due_date: paymentDateStr
                    };

                    const isSent = await sendNHNKakao(tel, kakaoParams);
                    if (isSent) {
                        updateUpdates.push("kakao_state = 'success'");
                        console.log(`💬 Kakao Sent: ${tel}`);
                    } else {
                        updateUpdates.push("kakao_state = 'fail'");
                        console.error(`💬 Kakao Fail: ${tel}`);
                    }
                }
            }

            // (C) DB 업데이트
            if (updateUpdates.length > 0) {
                const updateSql = `UPDATE ${TABLE_NAMES.SBN_PAYEE_REQUEST} SET ${updateUpdates.join(', ')} WHERE idx = ?`;
                await connection.execute(updateSql, [idx]);
            }

            // (D) 먼데이 상태 업데이트
            if (mondayStatusToUpdate && item_id) {
                await updateMondayStatus(item_id, mondayStatusToUpdate);
                if (mondayStatusToUpdate === "발송 성공") successCount++;
            }
        }

        return new Response(JSON.stringify({
            message: 'Notification Job Completed',
            processed_count: targets.length,
            success_email_count: successCount
        }), { status: 200 });

    } catch (error) {
        console.error('Server Error:', error);
        return new Response(JSON.stringify({ message: 'Server Error', error: error.message }), { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}