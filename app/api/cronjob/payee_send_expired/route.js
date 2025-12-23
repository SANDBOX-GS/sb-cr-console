export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { NextResponse } from 'next/server';
import {
    TABLE_NAMES,
    MONDAY_API_CONFIG,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS
} from '@/constants/dbConstants';
import { MONDAY_LABEL } from '@/constants/mondayLabel';
import { sendNHNEmail, sendNHNKakao } from '@/lib/nhnSender';

// todo [설정] 정보제공동의 기본 URL (임시로 패스워드 등록페이지로 보냄)
const REGISTER_BASE_URL = "http://13.125.225.158:8009/pw_register";

export async function POST(request) {
    const pool = await dbConnect();

    try {
        // =========================================================================
        // [STEP 1] 대상 조회
        // =========================================================================
        // 조건:
        // 1. A.agree_mail_state가 'none' (미발송)
        // 2. A.agree_expired_at 유효기간이 1일 이하로 남았거나 지남

        const query = `
            SELECT
                A.idx AS payee_idx, A.user_name, A.biz_name, A.biz_type, A.payout_ratio_id,
                B.idx AS member_idx, B.user_id, B.email AS member_email, B.tel AS member_tel
            FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} AS A
                     JOIN ${TABLE_NAMES.SBN_MEMBER} AS B ON A.member_idx = B.idx
            WHERE A.agree_mail_state = 'none'
              AND A.agree_expired_at IS NOT NULL
              AND DATEDIFF(A.agree_expired_at, CURDATE()) <= 1
        `;

        const [targetPayees] = await pool.execute(query);

        if (!targetPayees || targetPayees.length === 0) {
            return NextResponse.json({ message: 'No targets to process.' });
        }

        // =========================================================================
        // [STEP 2] 날짜 계산
        // =========================================================================
        const now = new Date();
        const currentYear = String(now.getFullYear());
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const paymentDateStr = `${currentYear}.${String(now.getMonth() + 2).padStart(2, '0')}.10 예정`;

        // =========================================================================
        // [STEP 3] 루프 처리
        // =========================================================================
        const results = [];
        const reqCols = MONDAY_COLUMN_IDS.PAYEE_REQUEST;
        const reqLabels = MONDAY_LABEL.PAYEE_REQUEST;

        for (const payee of targetPayees) {
            let newMondayItemId = 0;
            let processStatus = 'fail';
            let conn = null;

            // 결과 저장용 변수
            let emailResult = { success: false, message: null };
            let kakaoResult = { success: false, message: null, status: 'none' };

            try {
                // -------------------------------------------------------------
                // [STEP 3-1] 이메일 발송 (라이브러리 사용)
                // -------------------------------------------------------------
                const linkUrl = `${REGISTER_BASE_URL}?code=${payee.user_id}`;
                const displayName = (payee.biz_type === 'individual')
                    ? payee.user_name
                    : (payee.biz_name || payee.user_name);

                // 템플릿 파라미터 (이메일, 카카오 공통 사용 가능)
                const sendParams = {
                    year: currentYear,
                    month: currentMonth,
                    payment_date: paymentDateStr,
                    link_url: linkUrl,
                    name: displayName, // 카카오 알림톡 변수
                    url: linkUrl,      // 카카오 알림톡 변수
                };

                // -------------------------------------------------------------
                // [STEP 3-2] 이메일 발송
                // -------------------------------------------------------------
                const emailRes = await sendNHNEmail(payee.member_email, displayName, sendParams);
                emailResult = {
                    success: emailRes.success,
                    message: emailRes.success ? null : emailRes.message
                };

                if (emailResult.success) console.log(`📧 Email Sent: ${payee.member_email}`);
                else console.error(`❌ Email Fail: ${payee.member_email} (${emailResult.message})`);

                // -------------------------------------------------------------
                // [STEP 3-3] 카카오 알림톡 발송 (전화번호 있을 때만)
                // -------------------------------------------------------------
                if (payee.member_tel && payee.member_tel.length > 9) {
                    const kakaoRes = await sendNHNKakao(payee.member_tel, sendParams);
                    kakaoResult = {
                        success: kakaoRes.success,
                        message: kakaoRes.success ? null : kakaoRes.message,
                        status: kakaoRes.success ? 'success' : 'fail'
                    };

                    if (kakaoResult.success) console.log(`💬 Kakao Sent: ${payee.member_tel}`);
                    else console.error(`❌ Kakao Fail: ${payee.member_tel} (${kakaoResult.message})`);
                } else {
                    kakaoResult.status = 'none'; // 번호 없음
                }

                // 최종 처리 상태 (이메일 성공 여부를 기준으로 DB agree_mail_state 업데이트)
                processStatus = emailResult.success ? 'complete' : 'fail';

                // 먼데이 라벨 결정 (이메일 기준)
                const mondayStatusLabel = emailResult.success
                    ? reqLabels.REQUEST_STATE.SENT
                    : reqLabels.REQUEST_STATE.FAILED;

                // -------------------------------------------------------------
                // [STEP 3-4] Monday.com 아이템 생성
                // -------------------------------------------------------------
                const linkedItemId = parseInt(payee.payout_ratio_id) || null;

                const columnValues = {
                    [reqCols.EMAIL]: { email: payee.member_email, text: payee.member_email },
                    [reqCols.PHONE]: { phone: payee.member_tel, countryShortName: "KR" },
                    [reqCols.STATUS]: mondayStatusLabel,
                    [reqCols.PAYEE_REGISTER_STATE]: reqLabels.PAYEE_REGISTER_STATE.REGISTERED,
                    [reqCols.AGREE_STATE]: reqLabels.AGREE_STATE.AGREED,
                    ...(linkedItemId && { [reqCols.PAYEE_INFO]: { item_ids: [linkedItemId] } })
                };

                const mutationQuery = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
                    create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) { id }
                }`;

                const response = await fetch(MONDAY_API_CONFIG.URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': MONDAY_API_CONFIG.TOKEN
                    },
                    body: JSON.stringify({
                        query: mutationQuery,
                        variables: {
                            boardId: parseInt(MONDAY_BOARD_IDS.PAYEE_REQUEST),
                            itemName: displayName,
                            columnValues: JSON.stringify(columnValues)
                        }
                    })
                });

                const resJson = await response.json();
                if (!resJson.errors && resJson.data?.create_item?.id) {
                    newMondayItemId = resJson.data.create_item.id;
                } else {
                    console.error(`⚠️ Monday Creation Failed:`, resJson.errors);
                }

                // -------------------------------------------------------------
                // [STEP 3-5] DB 트랜잭션 (Request Insert -> Log Insert -> Update)
                // -------------------------------------------------------------
                if (typeof pool.getConnection === 'function') {
                    conn = await pool.getConnection();
                } else {
                    conn = pool;
                }
                await conn.beginTransaction();

                // 1. 요청 이력(sb_cr_console_payee_request) INSERT
                // insertId를 받기 위해 execute 결과를 변수에 담음
                const [insertResult] = await conn.execute(
                    `INSERT INTO ${TABLE_NAMES.SBN_PAYEE_REQUEST} 
                     (item_id, email, tel, email_state, kakao_state, created_at) 
                     VALUES (?, ?, ?, ?, ?, NOW())`,
                    [
                        newMondayItemId || 0,
                        payee.member_email,
                        payee.member_tel,
                        emailResult.success ? 'success' : 'fail',
                        kakaoResult.status
                    ]
                );

                const requestIdx = insertResult.insertId;

                // 2. 발송 로그(sb_cr_console_send_log) INSERT
                // payee_request 테이블을 참조하도록 저장
                await conn.execute(
                    `INSERT INTO ${TABLE_NAMES.SBN_SEND_LOG}
                     (ref_table_name, ref_table_idx, email, email_state, email_err, tel, kakao_state, kakao_err, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        TABLE_NAMES.SBN_PAYEE_REQUEST, // ref_table_name
                        requestIdx,                    // ref_table_idx (위에서 구한 값)
                        payee.member_email,
                        emailResult.success ? 'success' : 'fail',
                        emailResult.message,           // 실패 사유 (없으면 null)
                        payee.member_tel,
                        kakaoResult.status,            // none, success, fail
                        kakaoResult.message            // 실패 사유 (없으면 null)
                    ]
                );

                // 3. 수취인 정보(sb_cr_console_member_payee) UPDATE
                await conn.execute(
                    `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE}
                     SET agree_mail_state = ?, updated_at = NOW()
                     WHERE idx = ?`,
                    [processStatus, payee.payee_idx]
                );

                await conn.commit();

                results.push({ idx: payee.payee_idx, status: processStatus });

            } catch (innerError) {
                if (conn) {
                    try { await conn.rollback(); } catch(e) {}
                }
                console.error(`❌ Process Error for payee idx ${payee.payee_idx}:`, innerError.message);
                results.push({ idx: payee.payee_idx, status: 'error', error: innerError.message });
            } finally {
                if (conn && typeof pool.getConnection === 'function') {
                    conn.release();
                }
            }
        }

        return NextResponse.json({
            message: 'Process completed',
            total_targets: targetPayees.length,
            results: results
        });

    } catch (error) {
        console.error("🔥 Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}