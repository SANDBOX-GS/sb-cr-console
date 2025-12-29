export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import {
    TABLE_NAMES,
    NHN_CONFIG,
    MONDAY_API_CONFIG,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS,
} from "@/constants/dbConstants";
import { MONDAY_LABEL } from "@/constants/mondayLabel";
import { sendNHNEmail, sendNHNKakao } from "@/lib/nhnSender";

// todo [설정] 비밀번호 등록 페이지 기본 URL (나중에 환경변수 등으로 변경 가능)
const REGISTER_BASE_URL = "https://creator.sandbox.co.kr/register";

// [추가] UUID 생성 함수
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

// ==========================================
// [추가] 먼데이 CR 인벤토리 이름 가져오기 (Mirror 컬럼)
// ==========================================
async function getMondayCrName(itemId) {
    if (!itemId) return "";

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
        return "";
    }

    const variables = {
        itemId: parseInt(itemId),
        columnId: [targetColumnId],
    };

    try {
        const response = await fetch(MONDAY_API_CONFIG.URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: MONDAY_API_CONFIG.TOKEN,
            },
            body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();

        // 🔍 [디버깅 로그] 먼데이 API 원본 응답 확인 (이 로그를 꼭 확인하세요!)
        console.log(
            `🔍 Monday Raw Response (Item: ${itemId}):`,
            JSON.stringify(result, null, 2)
        );

        if (result.errors) {
            console.error("❌ Monday API Error:", result.errors);
            return "";
        }

        if (result.data && result.data.items.length > 0) {
            const item = result.data.items[0];

            // 컬럼 데이터가 아예 없는 경우 (컬럼 ID가 틀렸을 때 발생)
            if (!item.column_values || item.column_values.length === 0) {
                console.error(
                    `⚠️ No column values found for ID: ${targetColumnId}. Check if this column exists on the board.`
                );
                return "";
            }

            const colValue = item.column_values[0];

            // [수정 2] display_value가 없으면 text라도 가져오도록 처리
            const finalName = colValue.display_value || colValue.text || "";

            // 따옴표(")가 포함된 경우 제거 (JSON 파싱 잔여물 등)
            return finalName.replace(/"/g, "");
        }

        return "";
    } catch (e) {
        console.error(`❌ Monday Fetch Name Error (Item: ${itemId}):`, e);
        return "";
    }
}

// ==========================================
// 1-1. [기존] 수취인 정보 요청 보드 상태 업데이트
// ==========================================
async function updateMondayStatus(itemId, labelValue) {
    const columnId = MONDAY_COLUMN_IDS.PAYEE_REQUEST.STATUS;
    const boardId = MONDAY_BOARD_IDS.PAYEE_REQUEST;

    await executeMondayStatusUpdate(
        boardId,
        itemId,
        columnId,
        labelValue,
        "Payee Request"
    );
}

// ==========================================
// 1-2. [추가] 과업 정산 보드 상태 업데이트 (반복문 처리)
// ==========================================
async function updateWorkSettlementStatus(itemIdsStr, labelValue) {
    if (!itemIdsStr) return;

    // 콤마(,)로 구분된 ID들을 배열로 변환 및 공백 제거
    const itemIds = itemIdsStr
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

    if (itemIds.length === 0) return;

    const columnId = MONDAY_COLUMN_IDS.WORK_SETTLEMENT.STATUS; // 'color_mkygz7n5'
    const boardId = MONDAY_BOARD_IDS.WORK_SETTLEMENT;

    console.log(
        `🔄 Updating Work Settlement Items: [${itemIds.join(
            ", "
        )}] -> ${labelValue}`
    );

    // 연결된 모든 정산 아이템 업데이트 (병렬 처리)
    await Promise.all(
        itemIds.map(async (id) => {
            await executeMondayStatusUpdate(
                boardId,
                id,
                columnId,
                labelValue,
                "Work Settlement"
            );
        })
    );
}

// ==========================================
// [공통] 먼데이 상태 업데이트 실행 함수
// ==========================================
async function executeMondayStatusUpdate(
    boardId,
    itemId,
    columnId,
    labelValue,
    logPrefix
) {
    const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
        change_simple_column_value (board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
            id
        }
    }`;

    const variables = {
        boardId: parseInt(boardId),
        itemId: parseInt(itemId),
        columnId: columnId,
        value: labelValue,
    };

    try {
        const response = await fetch(MONDAY_API_CONFIG.URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: MONDAY_API_CONFIG.TOKEN,
            },
            body: JSON.stringify({ query, variables }),
        });

        const result = await response.json();
        if (result.errors) {
            console.error(
                `❌ [${logPrefix}] Update Error (Item: ${itemId}):`,
                result.errors
            );
        } else {
            console.log(
                `✅ [${logPrefix}] Updated: ${itemId} -> ${labelValue}`
            );
        }
    } catch (e) {
        console.error(`❌ [${logPrefix}] API Error (Item: ${itemId}):`, e);
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
            return new Response(
                JSON.stringify({ message: "발송 대기중인 건이 없습니다." }),
                { status: 200 }
            );
        }

        const now = new Date();
        const currentYear = String(now.getFullYear());
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");

        const paymentDateStr = `${currentYear}.${String(
            now.getMonth() + 2
        ).padStart(2, "0")}.10 예정`;
        const writeDateStr = `${currentYear}년 ${currentMonth}월 ${now.getDate()}일`;
        const writeDetailStr = `${currentYear}년 ${currentMonth}월 귀속 수익`;

        let successCount = 0;

        for (const target of targets) {
            const {
                idx,
                item_id,
                email,
                tel,
                email_state,
                kakao_state,
                board_relation_mkxsa8rp,
            } = target;
            const nameAsId = email;

            let updateUpdates = [];
            let mondayStatusToUpdate = null;

            // ------------------------------------------------------------------
            // 🔹 [STEP 0] 공통 데이터 준비 (회원 확인, 이름 확보, 링크 생성)
            // ------------------------------------------------------------------
            // 이 로직을 if문 밖으로 꺼내야 이메일/카카오톡 어디서든 쓸 수 있습니다.

            let targetUUID = "";
            let targetName = ""; // 사용자 실명 (cr_inv_name)
            let linkUrl = "";

            try {
                // 1. 이미 존재하는 회원인지 확인 (이름도 같이 조회)
                const [members] = await connection.execute(
                    `SELECT user_id FROM ${TABLE_NAMES.SBN_MEMBER} WHERE email = ?`,
                    [email]
                );

                if (members.length > 0) {
                    // [CASE A] 이미 존재하는 회원 -> DB 정보 사용
                    targetUUID = members[0].user_id;
                    targetName = members[0].cr_inv_name; // DB에 저장된 이름 사용
                } else {
                    // [CASE B] 신규 회원 -> 먼데이 API로 이름 가져오기 & DB 생성

                    // 1) 먼데이 API 호출 (이름 획득)
                    targetName = await getMondayCrName(item_id);

                    // 2) UUID 생성
                    targetUUID = generateUUID();

                    // 3) DB Insert
                    await connection.execute(
                        `INSERT INTO ${TABLE_NAMES.SBN_MEMBER}
                             (user_id, email, cr_inv_name, active_status)
                         VALUES (?, ?, ?, 'inactive')`,
                        [targetUUID, email, targetName]
                    );
                    console.log(`👤 New Member Inserted: ${email} / Name: ${targetName}`);
                }

                // 2. 링크 생성 (공통 변수)
                linkUrl = `${REGISTER_BASE_URL}?code=${targetUUID}`;
            } catch (dbErr) {
                console.error(`❌ Critical Error for ${email}:`, dbErr);
                // 회원 정보를 못 가져오면 이메일도, 카카오톡도 못 보내므로 스킵
                continue;
            }

            // ------------------------------------------------------------------
            // (A) 이메일 발송
            // ------------------------------------------------------------------
            if (email_state === "pending") {
                const emailParams = {
                    year: currentYear,
                    month: currentMonth,
                    payment_date: paymentDateStr,
                    link_url: linkUrl,
                };

                // nameAsId 대신 실제 targetName 사용해도 되고, 기존 로직 유지하려면 email 사용
                const sendResult = await sendNHNEmail(email, email, emailParams);

                if (sendResult.success) {
                    updateUpdates.push("email_state = 'success'");
                    mondayStatusToUpdate = MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT;
                    console.log(`📧 Email Sent: ${email}`);
                } else {
                    updateUpdates.push("email_state = 'fail'");
                    mondayStatusToUpdate = MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.FAILED;
                    console.error(`📧 Email Fail: ${email} / Reason: ${sendResult.message}`);
                }
            }

            // ------------------------------------------------------------------
            // (B) 알림톡 발송
            // ------------------------------------------------------------------
            if (kakao_state === "pending") {
                if (tel && tel.length > 9) {

                    const kakaoParams = {
                        name: targetName,
                        url: linkUrl
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

            // ------------------------------------------------------------------
            // (C) DB 상태 업데이트
            // ------------------------------------------------------------------
            if (updateUpdates.length > 0) {
                const updateSql = `UPDATE ${
                    TABLE_NAMES.SBN_PAYEE_REQUEST
                } SET ${updateUpdates.join(", ")} WHERE idx = ?`;
                await connection.execute(updateSql, [idx]);
            }

            // ------------------------------------------------------------------
            // (D) 먼데이 상태 업데이트 (수취인 정보 + 과업 정산 연결 아이템들)
            // ------------------------------------------------------------------
            if (mondayStatusToUpdate) {
                // 1. 수취인 정보 요청 보드 상태 업데이트
                if (item_id) {
                    await updateMondayStatus(item_id, mondayStatusToUpdate);
                    if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT) successCount++;
                }

                // 2. [추가] 과업 정산 보드 상태 업데이트 (연결된 모든 아이템)
                // board_relation_mkxsa8rp 값 예시: "11111, 22222, 33333"
                if (board_relation_mkxsa8rp) {
                    let settlementLabel = "";

                    if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT) {
                        settlementLabel = MONDAY_LABEL.WORK_SETTLEMENT.SEND_STATE.SENT; // 과업 정산 보드용 라벨
                    } else if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.FAILED) {
                        settlementLabel = MONDAY_LABEL.WORK_SETTLEMENT.SEND_STATE.FAILED; // 과업 정산 보드용 라벨
                    }

                    // 변환된 라벨로 업데이트 요청
                    if (settlementLabel) {
                        await updateWorkSettlementStatus(
                            board_relation_mkxsa8rp,
                            settlementLabel
                        );
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({
                message: "Notification Job Completed",
                processed_count: targets.length,
                success_email_count: successCount,
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Server Error:", error);
        return new Response(
            JSON.stringify({ message: "Server Error", error: error.message }),
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
