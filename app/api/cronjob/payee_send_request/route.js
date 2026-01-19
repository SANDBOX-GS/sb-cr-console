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
import { generateUUID, getCurrentKSTString } from "@/lib/utils"

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
async function updateWorkSettlementStatus(itemIdsStr, labelValue, logMessage) { // 인자명도 알기 쉽게 변경
    if (!itemIdsStr) return;

    // 콤마(,)로 구분된 ID들을 배열로 변환 및 공백 제거
    const itemIds = itemIdsStr
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id);

    if (itemIds.length === 0) return;

    const boardId = MONDAY_BOARD_IDS.WORK_SETTLEMENT;
    const columnId = MONDAY_COLUMN_IDS.WORK_SETTLEMENT.STATUS;
    const logColId = MONDAY_COLUMN_IDS.WORK_SETTLEMENT.SEND_LOG;

    console.log(
        `🔄 Updating Work Settlement Items: [${itemIds.join(", ")}] -> ${labelValue}`
    );

    // 연결된 모든 정산 아이템 업데이트 (병렬 처리)
    await Promise.all(
        itemIds.map(async (id) => {
            // 1. 상태값 변경
            await changeMondayColumnValue(
                boardId,
                id,
                columnId,
                labelValue,
                "Work Settlement"
            );

            // 2. 발송 로그 남기기
            if (logMessage) {
                await changeMondayColumnValue(
                    boardId,
                    id,
                    logColId,
                    logMessage, // 그대로 사용
                    "Work Settlement Log"
                );
            }
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

        // ============================================================
        // [변경 핵심] 이메일 기준으로 데이터 그룹화 (중복 발송 방지)
        // ============================================================
        const groups = {};

        targets.forEach((target) => {
            const key = target.email; // 이메일을 기준으로 묶음
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(target);
        });

        let successEmailCount = 0;
        let processedGroups = 0;

        // 그룹별 순회 (발송은 그룹당 1번만 수행)
        for (const emailKey of Object.keys(groups)) {
            const groupItems = groups[emailKey];

            // 대표 정보 추출 (첫 번째 아이템 기준)
            // 같은 그룹이면 email과 tel은 동일하다고 가정 (이전 로직에서 이미 정제됨)
            const representative = groupItems[0];
            const { email, tel } = representative;

            // 상태 체크: 그룹 내 아이템 중 하나라도 pending이면 발송 시도
            const needEmail = groupItems.some(t => t.email_state === 'pending');
            const needKakao = groupItems.some(t => t.kakao_state === 'pending');

            // ------------------------------------------------------------------
            // 🔹 [STEP 0] 공통 데이터 준비 (회원 확인, 이름 확보, UUID) - 1회 수행
            // ------------------------------------------------------------------
            let targetUUID = "";
            let targetName = "";

            // 기본값: 신규 요청용 (002)
            let emailTemplateId = 'cr_email_002';
            let kakaoTemplateId = 'cr_console_002';
            let shouldSend = true; // 발송 할지 말지 결정하는 플래그
            let expiredDateStr = null; // 003 템플릿에 넣을 만료일자 변수

            try {
                const joinQuery = `
                    SELECT 
                        m.user_id, 
                        m.cr_inv_name, 
                        p.agree_expired_at 
                    FROM ${TABLE_NAMES.SBN_MEMBER} m
                    LEFT JOIN ${TABLE_NAMES.SBN_MEMBER_PAYEE} p 
                        ON m.idx = p.member_idx
                    WHERE m.email = ?
                    ORDER BY p.idx DESC 
                    LIMIT 1
                `;

                const [rows] = await connection.execute(joinQuery, [email]);

                if (rows.length > 0) {
                    // [CASE A] 이미 존재하는 회원
                    targetUUID = rows[0].user_id;
                    targetName = rows[0].cr_inv_name;

                    const expiredAt = rows[0].agree_expired_at;

                    if (expiredAt) {
                        const today = new Date();
                        const expDate = new Date(expiredAt);

                        if (expDate >= today) {
                            // 1. 유효기간이 아직 남음 -> 발송 스킵 (이미 등록된 회원)
                            shouldSend = false;
                        } else {
                            // 2. 유효기간 만료됨 -> 갱신 요청 템플릿(003) 변경
                            emailTemplateId = 'cr_email_003';
                            kakaoTemplateId = 'cr_console_003';
                            shouldSend = true;

                            // 만료일자 포맷팅 (YYYY-MM-DD)
                            expiredDateStr = expDate.toISOString().split('T')[0];
                        }
                    } else {
                        // 3. 회원은 있는데 Payee 정보(유효기간)가 없음 -> 신규(002)로 발송
                        // console.log(`ℹ️ Member exists but No Payee Info. Sending 002. (${email})`);
                        // defaults (002, true) 유지
                    }
                } else {
                    // [CASE B] 아예 신규 회원 -> DB 생성 및 002 발송
                    const rawName = await getMondayItemName(representative.item_id);
                    targetName = rawName || email;
                    targetUUID = generateUUID();

                    await connection.execute(
                        `INSERT INTO ${TABLE_NAMES.SBN_MEMBER} 
                        (user_id, email, cr_inv_name, active_status) 
                        VALUES (?, ?, ?, 'inactive')`,
                        [targetUUID, email, targetName]
                    );
                    console.log(`👤 New Member Inserted: ${email}`);
                }
            } catch (dbErr) {
                console.error(`❌ DB Check Error for ${email}:`, dbErr);
                continue; // 치명적 에러 시 해당 그룹 스킵
            }

            // ------------------------------------------------------------------
            // [변수 준비] 발송 결과 저장
            // ------------------------------------------------------------------
            let emailResultStatus = null; // 'success' | 'fail' | null
            let kakaoResultStatus = null; // 'success' | 'fail' | null
            let emailErrorMsg = null;
            let kakaoErrorMsg = null;
            let mondayStatusToUpdate = null;

            // ------------------------------------------------------------------
            // (A) 이메일 발송 - 그룹당 1회
            // ------------------------------------------------------------------
            if (needEmail) {
                if (shouldSend) {
                    // 기본 파라미터
                    const emailParams = {
                        template_id: emailTemplateId,
                        code: targetUUID
                    };

                    // 만료일자 변수가 있으면(003일 경우) 파라미터에 추가
                    if (expiredDateStr) {
                        emailParams.expired_date = expiredDateStr;
                    }
                    const sendResult = await sendNHNEmail(email, email, emailParams);

                    if (sendResult.success) {
                        emailResultStatus = 'success';
                        mondayStatusToUpdate = MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT;
                        console.log(`📧 Email Sent: ${email} [${emailTemplateId}]`);
                        successEmailCount++;
                    } else {
                        emailResultStatus = 'fail';
                        emailErrorMsg = sendResult.message || "API Error";
                        mondayStatusToUpdate = MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.FAILED;
                        console.error(`📧 Email Fail: ${email}`);
                    }
                } else {
                    // [스킵 처리] 이미 유효한 회원이므로 '성공'으로 간주하여 DB 업데이트 처리
                    emailResultStatus = 'skipped';
                    mondayStatusToUpdate = MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT; // 먼데이는 '완료' 처리
                    console.log(`⏭️ Email Skipped (Already Valid): ${email}`);
                }
            }

            // ------------------------------------------------------------------
            // (B) 알림톡 발송 - 그룹당 1회
            // ------------------------------------------------------------------
            if (needKakao) {
                if (shouldSend && tel && tel.length > 9) {
                    // 기본 파라미터
                    const kakaoParams = {
                        template_code: kakaoTemplateId,
                        code: targetUUID
                    };

                    // 만료일자 변수가 있으면(003일 경우) 파라미터에 추가
                    if (expiredDateStr) {
                        kakaoParams.expired_date = expiredDateStr;
                    }
                    const kakaoResult = await sendNHNKakao(tel, kakaoParams);

                    if (kakaoResult.success) {
                        kakaoResultStatus = 'success';
                        console.log(`💬 Kakao Sent: ${tel} [${kakaoTemplateId}]`);
                    } else {
                        kakaoResultStatus = 'fail';
                        kakaoErrorMsg = kakaoResult.message || "API Error";
                        console.error(`💬 Kakao Fail: ${tel}`);
                    }
                } else if (!shouldSend) {
                    // [스킵 처리]
                    kakaoResultStatus = 'skipped';
                    console.log(`⏭️ Kakao Skipped (Already Valid): ${tel}`);
                }
            }

            // ------------------------------------------------------------------
            // (C) 실패 시 슬랙 알림 - 그룹당 1회 (대표 아이템 기준)
            // ------------------------------------------------------------------
            if (emailResultStatus === 'fail' || kakaoResultStatus === 'fail') {
                const failedItem = representative; // 슬랙 알림용 대표 아이템
                let mentionTarget = null;

                try {
                    let linkedWorkItemId = null;
                    if (failedItem.board_relation_mkxsa8rp) {
                        const ids = failedItem.board_relation_mkxsa8rp.split(',').map(s => s.trim());
                        if (ids.length > 0 && ids[0]) linkedWorkItemId = ids[0];
                    }
                    if (!linkedWorkItemId) {
                        linkedWorkItemId = await getLinkedItemId(failedItem.item_id, MONDAY_COLUMN_IDS.PAYEE_REQUEST.LINK_TASK_SETTLEMENT);
                    }
                    if (linkedWorkItemId) {
                        mentionTarget = await getMondayAssigneeSlackTag(linkedWorkItemId);
                    }

                    const failType = emailResultStatus === 'fail' ? "📧 이메일 발송 실패" : "💬 알림톡 발송 실패";
                    const failMsg = emailResultStatus === 'fail'
                        ? "외부 CR 정산용 메일주소에 오류가 있습니다."
                        : "외부 CR 정산용 연락처에 오류가 있습니다.";

                    await sendSlack({
                        mentionTarget: mentionTarget,
                        title: failType,
                        message: `${failMsg} 담당 부서와 확인 후 정보를 수정해주세요. (영향받은 건수: ${groupItems.length}건)`,
                        fields: [
                            { title: "대상", value: `${email} / ${tel || '-'}` },
                            { title: "오류 내용", value: emailErrorMsg || kakaoErrorMsg }
                        ],
                        buttonText: "먼데이 아이템 확인",
                        buttonUrl: `https://sandboxnetwork.monday.com/boards/${MONDAY_BOARD_IDS.PAYEE_REQUEST}/pulses/${failedItem.item_id}`
                    });
                } catch (e) {
                    console.error("⚠️ Slack Alert Logic Failed:", e);
                }
            }

            // ------------------------------------------------------------------
            // (D) 결과 일괄 반영 - 그룹 내 모든 아이템 순회
            // ------------------------------------------------------------------
            const sentTimeStr = getCurrentKSTString();

            for (const item of groupItems) {
                const { idx, item_id, board_relation_mkxsa8rp } = item;
                const updateUpdates = [];

                // 1. DB 업데이트 쿼리 생성
                if (emailResultStatus && item.email_state === 'pending') {
                    updateUpdates.push(`email_state = '${emailResultStatus}'`);
                }
                if (kakaoResultStatus && item.kakao_state === 'pending') {
                    updateUpdates.push(`kakao_state = '${kakaoResultStatus}'`);
                }

                if (updateUpdates.length > 0) {
                    // 1-1. SBN_PAYEE_REQUEST 테이블 업데이트
                    const updateSql = `UPDATE ${TABLE_NAMES.SBN_PAYEE_REQUEST} SET ${updateUpdates.join(", ")} WHERE idx = ?`;
                    await connection.execute(updateSql, [idx]);

                    // 1-2. SBN_SEND_LOG 테이블 적재 (로그는 개별적으로 남김)
                    const logPayload = {
                        ref_table_name: TABLE_NAMES.SBN_PAYEE_REQUEST,
                        ref_table_idx: idx,
                        email: email || null,
                        email_state: emailResultStatus,
                        email_err: emailErrorMsg,
                        tel: tel || null,
                        kakao_state: kakaoResultStatus,
                        kakao_err: kakaoErrorMsg
                    };
                    await connection.query(`INSERT INTO ${TABLE_NAMES.SBN_SEND_LOG} SET ?`, logPayload);
                }

                // 2. 먼데이 상태 업데이트
                if (mondayStatusToUpdate) {
                    // Payee Request 보드
                    if (item_id) {
                        await updateMondayStatus(item_id, mondayStatusToUpdate);
                    }

                    // Work Settlement 보드 (연결된 정산 건들)
                    if (board_relation_mkxsa8rp) {
                        let settlementLabel = "";
                        let logText = "";

                        if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.SENT) {
                            // [성공]
                            settlementLabel = MONDAY_LABEL.WORK_SETTLEMENT.SEND_STATE.SENT;
                            logText = `발송시각: ${sentTimeStr}`;
                        } else if (mondayStatusToUpdate === MONDAY_LABEL.PAYEE_REQUEST.REQUEST_STATE.FAILED) {
                            // [실패]
                            settlementLabel = MONDAY_LABEL.WORK_SETTLEMENT.SEND_STATE.FAILED;

                            // 에러 메시지 결정 (이메일 에러가 있으면 이메일 우선, 없으면 알림톡 에러)
                            const reason = emailErrorMsg || kakaoErrorMsg || "알 수 없는 오류";
                            logText = `발송시각: ${sentTimeStr} (${reason})`;
                        }

                        // 라벨과 로그 메시지를 함께 전달
                        if (settlementLabel) {
                            await updateWorkSettlementStatus(board_relation_mkxsa8rp, settlementLabel, logText);
                        }
                    }
                }
            }

            processedGroups++;
        }

        return new Response(
            JSON.stringify({
                message: "Notification Job Completed",
                processed_groups: processedGroups,
                total_targets: targets.length,
                success_groups: successEmailCount,
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