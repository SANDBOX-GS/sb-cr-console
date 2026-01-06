export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import {
    TABLE_NAMES,
    MONDAY_API_CONFIG,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS,
} from "@/constants/dbConstants";
import { MONDAY_LABEL } from "@/constants/mondayLabel";
import { sendNHNEmail, sendNHNKakao } from "@/lib/nhnSender";
import { getMondayItemName } from "@/lib/mondayCommon";

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

    const columnId = MONDAY_COLUMN_IDS.WORK_SETTLEMENT.STATUS;
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

            let updateUpdates = [];
            let mondayStatusToUpdate = null;

            // ------------------------------------------------------------------
            // 🔹 [STEP 0] 공통 데이터 준비 (회원 확인, 이름 확보, 링크 생성)
            // ------------------------------------------------------------------

            let targetUUID = "";
            let targetName = ""; // 사용자 실명 (cr_inv_name)

            try {
                // 1. 이미 존재하는 회원인지 확인 (이름도 같이 조회)
                const [members] = await connection.execute(
                    `SELECT user_id, cr_inv_name FROM ${TABLE_NAMES.SBN_MEMBER} WHERE email = ?`,
                    [email]
                );

                if (members.length > 0) {
                    // [CASE A] 이미 존재하는 회원 -> DB 정보 사용
                    targetUUID = members[0].user_id;
                    targetName = members[0].cr_inv_name; // DB에 저장된 이름 사용
                } else {
                    // [CASE B] 신규 회원 -> 먼데이 API로 이름 가져오기 & DB 생성
                    const rawName = await getMondayItemName(item_id);
                    targetName = rawName || email;

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
                    template_id: 'cr_email_002',
                    code: targetUUID,
                };

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
                        template_code: 'cr_console_002',
                        code: targetUUID,
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
            // (D) 먼데이 상태 업데이트
            // ------------------------------------------------------------------
            if (mondayStatusToUpdate) {
                // 1. 수취인 정보 요청 보드 상태 업데이트
                if (item_id) {
                    await updateMondayStatus(item_id, mondayStatusToUpdate);
                    if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT) successCount++;
                }

                // 2. 과업 정산 보드 상태 업데이트 (연결된 모든 아이템)
                // board_relation_mkxsa8rp 값 예시: "11111, 22222, 33333"
                if (board_relation_mkxsa8rp) {
                    let settlementLabel = "";

                    if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT) {
                        settlementLabel = MONDAY_LABEL.WORK_SETTLEMENT.SEND_STATE.SENT;
                    } else if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.FAILED) {
                        settlementLabel = MONDAY_LABEL.WORK_SETTLEMENT.SEND_STATE.FAILED;
                    }

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