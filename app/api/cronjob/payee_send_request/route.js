export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import {
    TABLE_NAMES,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS,
} from "@/constants/dbConstants";
import { MONDAY_LABEL } from "@/constants/mondayLabel";
import { sendNHNEmail, sendNHNKakao } from "@/lib/nhnSender";
import { getMondayItemName, changeMondayColumnValue, getLinkedItemId, getMondayAssigneeSlackTag } from "@/lib/mondayCommon";
import { sendSlack } from "@/lib/slackCommon";
import { generateUUID } from "@/lib/utils"

// ==========================================
// 1-1. [기존] 수취인 정보 요청 보드 상태 업데이트
// ==========================================
async function updateMondayStatus(itemId, labelValue) {
    const columnId = MONDAY_COLUMN_IDS.PAYEE_REQUEST.STATUS;
    const boardId = MONDAY_BOARD_IDS.PAYEE_REQUEST;

    await changeMondayColumnValue(
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
            await changeMondayColumnValue(
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

            // 발송 로그 적재용
            let logEmailState = null;
            let logEmailErr = null;
            let logKakaoState = null;
            let logKakaoErr = null;

            // ------------------------------------------------------------------
            // [공통] 담당자 멘션 타겟 관리 (Lazy Loading)
            // ------------------------------------------------------------------
            let mentionTarget = null;

            // 실패 시에만 호출하여 담당자 태그를 가져오는 헬퍼 함수
            const fetchMentionTarget = async () => {
                if (mentionTarget) return; // 이미 가져왔으면 패스

                try {
                    let linkedWorkItemId = null;

                    // 1. DB값 우선 사용 (API 호출 절약)
                    if (board_relation_mkxsa8rp) {
                        const ids = board_relation_mkxsa8rp.split(',').map(s => s.trim());
                        if (ids.length > 0 && ids[0]) linkedWorkItemId = ids[0];
                    }

                    // 2. DB에 없으면 먼데이 API로 조회
                    if (!linkedWorkItemId) {
                        linkedWorkItemId = await getLinkedItemId(item_id, MONDAY_COLUMN_IDS.PAYEE_REQUEST.LINK_TASK_SETTLEMENT);
                    }

                    // 3. 담당자(PM) 슬랙 태그 조회
                    if (linkedWorkItemId) {
                        mentionTarget = await getMondayAssigneeSlackTag(linkedWorkItemId);
                    }
                } catch (e) {
                    console.error("⚠️ Slack Mention Target Lookup Failed:", e);
                }
            };

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

                    logEmailState = 'success';

                    console.log(`📧 Email Sent: ${email}`);
                } else {
                    updateUpdates.push("email_state = 'fail'");
                    mondayStatusToUpdate = MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.FAILED;

                    const reason = sendResult.message || "Unknown API Error";

                    logEmailState = 'fail';
                    logEmailErr = reason;

                    console.error(`📧 Email Fail: ${email} / Reason: ${reason}`);

                    // [실패 처리] 담당자 조회 및 슬랙 전송
                    await fetchMentionTarget();

                    await sendSlack({
                        mentionTarget: mentionTarget,
                        title: "📧 이메일 발송 실패",
                        message: "외부 CR 정산용 메일주소에 오류가 있습니다. 메일주소에 오류가 있거나, 수취인 메일에 문제가 있을 수 있으니 담당 부서(BDG 혹은 ADN)와 확인하시어 [알림 발송용 이메일] 컬럼 정보에 추가/보완 후 다시 [이메일/알림톡 발송 요청] 버튼을 클릭해주세요.",
                        fields: [
                            { title: "대상 이메일", value: email },
                        ],
                        buttonText: "먼데이 아이템 바로가기",
                        buttonUrl: `https://sandboxnetwork.monday.com/boards/${MONDAY_BOARD_IDS.PAYEE_REQUEST}/pulses/${item_id}`
                    });
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

                    const kakaoResult = await sendNHNKakao(tel, kakaoParams);

                    if (kakaoResult.success) {
                        updateUpdates.push("kakao_state = 'success'");

                        logKakaoState = 'success';

                        console.log(`💬 Kakao Sent: ${tel}`);
                    } else {
                        updateUpdates.push("kakao_state = 'fail'");

                        // [추가] 실패 사유 로깅
                        const reason = kakaoResult.message || "Unknown Kakao API Error";

                        logKakaoState = 'fail';
                        logKakaoErr = reason;

                        console.error(`💬 Kakao Fail: ${tel} / Reason: ${reason}`);

                        // [실패 처리] 담당자 조회 및 슬랙 전송
                        await fetchMentionTarget();

                        await sendSlack({
                            mentionTarget: mentionTarget,
                            title: "💬 알림톡 발송 실패",
                            message: "외부 CR 정산용 연락처에 오류가 있습니다. 담당 부서(BDG 혹은 ADN)와 확인하시어 [알림톡 발송용 번호] 컬럼 정보에 추가/보완 후 다시 [이메일/알림톡 발송 요청] 버튼을 클릭해주세요.",
                            fields: [
                                { title: "대상 번호", value: tel },
                            ],
                            buttonText: "먼데이 아이템 바로가기",
                            buttonUrl: `https://sandboxnetwork.monday.com/boards/${MONDAY_BOARD_IDS.PAYEE_REQUEST}/pulses/${item_id}`
                        });
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

                // 발송 로그 테이블(SBN_SEND_LOG) 적재
                // 이메일 또는 카카오톡 시도가 있었을 경우에만 저장
                if (logEmailState || logKakaoState) {
                    const logPayload = {
                        ref_table_name: TABLE_NAMES.SBN_PAYEE_REQUEST,
                        ref_table_idx: idx,
                        email: email || null,
                        email_state: logEmailState,
                        email_err: logEmailErr,
                        tel: tel || null,
                        kakao_state: logKakaoState,
                        kakao_err: logKakaoErr
                    };

                    await connection.query(
                        `INSERT INTO ${TABLE_NAMES.SBN_SEND_LOG} SET ?`,
                        logPayload
                    );
                    console.log(`📝 Send Log Inserted (IDX: ${idx})`);
                }
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