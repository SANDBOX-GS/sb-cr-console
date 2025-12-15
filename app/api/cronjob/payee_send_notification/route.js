export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import {
    TABLE_NAMES,
    NHN_CONFIG,
    MONDAY_API_CONFIG,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS
} from '@/constants/dbConstants';

// [설정] 비밀번호 등록 페이지 기본 URL (나중에 환경변수 등으로 변경 가능)
const REGISTER_BASE_URL = "http://localhost:8009/pw_register";

// [추가] UUID 생성 함수
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==========================================
// [추가] 먼데이 CR 인벤토리 이름 가져오기 (Mirror 컬럼)
// ==========================================
async function getMondayCrName(itemId) {
    if (!itemId) return '';

// [수정 1] text와 value도 같이 요청해서 데이터가 어디에 들어오는지 확인
    const query = `query ($itemId: [ID!], $columnId: [String!]) {
        items (ids: $itemId) {
            column_values (ids: $columnId) {
                id
                text
                # 미러 컬럼일 경우 display_value 가져오기
                ... on MirrorValue {
                  display_value
                }
                # 혹시 보드 연결 컬럼일 경우 대비
                ... on BoardRelationValue {
                  display_value
                }
            }
        }
    }`;

    // 🚨 [체크 포인트] 상수가 올바르게 로드되었는지 확인
    const targetColumnId = MONDAY_COLUMN_IDS.PAYEE_REQUEST.MIRROR_CR_NAME;
    // 만약 undefined라면 상수가 잘못된 것입니다.
    if (!targetColumnId) {
        console.error("❌ Error: Column ID Constant is Undefined!");
        return '';
    }

    const variables = {
        itemId: parseInt(itemId),
        columnId: [targetColumnId]
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

        // 🔍 [디버깅 로그] 먼데이 API 원본 응답 확인 (이 로그를 꼭 확인하세요!)
        console.log(`🔍 Monday Raw Response (Item: ${itemId}):`, JSON.stringify(result, null, 2));

        if (result.errors) {
            console.error("❌ Monday API Error:", result.errors);
            return '';
        }

        if (result.data && result.data.items.length > 0) {
            const item = result.data.items[0];

            // 컬럼 데이터가 아예 없는 경우 (컬럼 ID가 틀렸을 때 발생)
            if (!item.column_values || item.column_values.length === 0) {
                console.error(`⚠️ No column values found for ID: ${targetColumnId}. Check if this column exists on the board.`);
                return '';
            }

            const colValue = item.column_values[0];

            // [수정 2] display_value가 없으면 text라도 가져오도록 처리
            const finalName = colValue.display_value || colValue.text || '';

            // 따옴표(")가 포함된 경우 제거 (JSON 파싱 잔여물 등)
            return finalName.replace(/"/g, '');
        }

        return '';
    } catch (e) {
        console.error(`❌ Monday Fetch Name Error (Item: ${itemId}):`, e);
        return '';
    }
}

// ==========================================
// 1-1. [기존] 수취인 정보 요청 보드 상태 업데이트
// ==========================================
async function updateMondayStatus(itemId, labelValue) {
    const columnId = MONDAY_COLUMN_IDS.PAYEE_REQUEST.STATUS;
    const boardId = MONDAY_BOARD_IDS.PAYEE_REQUEST;

    await executeMondayStatusUpdate(boardId, itemId, columnId, labelValue, "Payee Request");
}

// ==========================================
// 1-2. [추가] 과업 정산 보드 상태 업데이트 (반복문 처리)
// ==========================================
async function updateWorkSettlementStatus(itemIdsStr, labelValue) {
    if (!itemIdsStr) return;

    // 콤마(,)로 구분된 ID들을 배열로 변환 및 공백 제거
    const itemIds = itemIdsStr.split(',').map(id => id.trim()).filter(id => id);

    if (itemIds.length === 0) return;

    const columnId = MONDAY_COLUMN_IDS.WORK_SETTLEMENT.STATUS; // 'color_mkygz7n5'
    const boardId = MONDAY_BOARD_IDS.WORK_SETTLEMENT;

    console.log(`🔄 Updating Work Settlement Items: [${itemIds.join(', ')}] -> ${labelValue}`);

    // 연결된 모든 정산 아이템 업데이트 (병렬 처리)
    await Promise.all(itemIds.map(async (id) => {
        await executeMondayStatusUpdate(boardId, id, columnId, labelValue, "Work Settlement");
    }));
}

// ==========================================
// [공통] 먼데이 상태 업데이트 실행 함수
// ==========================================
async function executeMondayStatusUpdate(boardId, itemId, columnId, labelValue, logPrefix) {
    const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
        change_simple_column_value (board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
            id
        }
    }`;

    const variables = {
        boardId: parseInt(boardId),
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
            console.error(`❌ [${logPrefix}] Update Error (Item: ${itemId}):`, result.errors);
        } else {
            console.log(`✅ [${logPrefix}] Updated: ${itemId} -> ${labelValue}`);
        }
    } catch (e) {
        console.error(`❌ [${logPrefix}] API Error (Item: ${itemId}):`, e);
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
            SELECT idx, item_id, email, tel, email_state, kakao_state, board_relation_mkxsa8rp
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
            const { idx, item_id, email, tel, email_state, kakao_state, board_relation_mkxsa8rp } = target;
            const nameAsId = email;

            let updateUpdates = [];
            let mondayStatusToUpdate = null;

            // (A) 이메일 발송
            if (email_state === 'pending') {

                // 🔹 [STEP 1] 회원 확인 및 UUID 확보 (이메일 발송 전 선행)
                let targetUUID = '';

                try {
                    // 1-1. 이미 존재하는 회원인지 확인
                    const [members] = await connection.execute(
                        `SELECT user_id FROM ${TABLE_NAMES.SBN_MEMBER} WHERE email = ?`,
                        [email]
                    );

                    if (members.length > 0) {
                        // 이미 존재하면 기존 UUID 사용
                        targetUUID = members[0].user_id;
                    } else {
                        // 신규 회원인 경우: 먼데이에서 CR 이름 가져오기
                        // 1. 먼데이 API 호출하여 이름(display_value) 획득
                        const crInvName = await getMondayCrName(item_id);

                        // 2. UUID 생성
                        targetUUID = generateUUID();

                        // 3. DB Insert (cr_inv_name 포함)
                        // 주의: cr_inv_id는 먼데이에서 안 주면 공백 처리
                        await connection.execute(
                            `INSERT INTO ${TABLE_NAMES.SBN_MEMBER}
                                 (user_id, email, cr_inv_name, active_status)
                             VALUES (?, ?, ?, 'inactive')`,
                            [targetUUID, email, crInvName]
                        );
                        console.log(`👤 New Member Inserted: ${email} / UUID: ${targetUUID} / Name: ${crInvName}`);
                    }
                } catch (dbErr) {
                    console.error(`DB Error during Member Check/Insert for ${email}:`, dbErr);
                    // DB 에러 시 이메일 발송을 중단하고 다음 타겟으로 넘어감 (안전장치)
                    continue;
                }

                // 🔹 [STEP 2] 링크 URL 생성
                const linkUrl = `${REGISTER_BASE_URL}?code=${targetUUID}`;

                // 🔹 [STEP 3] 이메일 파라미터 구성
                const emailParams = {
                    year: currentYear,
                    month: currentMonth,
                    payment_date: paymentDateStr,
                    link_url: linkUrl // ✅ NHN 템플릿에 보낼 링크 변수
                };

                const isSent = await sendNHNEmail(email, nameAsId, emailParams);

                if (isSent) {
                    updateUpdates.push("email_state = 'success'");
                    mondayStatusToUpdate = "발송 성공";
                    console.log(`📧 Email Sent: ${email} (Link: ${linkUrl})`);
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

            // (D) 먼데이 상태 업데이트 (수취인 정보 + 과업 정산 연결 아이템들)
            if (mondayStatusToUpdate) {
                // 1. 수취인 정보 요청 보드 상태 업데이트
                if (item_id) {
                    await updateMondayStatus(item_id, mondayStatusToUpdate);
                    if (mondayStatusToUpdate === "발송 성공") successCount++;
                }

                // 2. [추가] 과업 정산 보드 상태 업데이트 (연결된 모든 아이템)
                // board_relation_mkxsa8rp 값 예시: "11111, 22222, 33333"
                if (board_relation_mkxsa8rp) {
                    let settlementLabel = "";

                    if (mondayStatusToUpdate === "발송 성공") {
                        settlementLabel = "발송완료"; // 과업 정산 보드용 라벨
                    } else if (mondayStatusToUpdate === "발송 실패") {
                        settlementLabel = "발송실패"; // 과업 정산 보드용 라벨
                    }

                    // 변환된 라벨로 업데이트 요청
                    if (settlementLabel) {
                        await updateWorkSettlementStatus(board_relation_mkxsa8rp, settlementLabel);
                    }
                }
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