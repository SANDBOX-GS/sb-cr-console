export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import {NextResponse} from "next/server";
import {
    TABLE_NAMES,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS,
} from "@/constants/dbConstants";
import {MONDAY_LABEL} from "@/constants/mondayLabel";
import {sendNHNEmail, sendNHNKakao} from "@/lib/nhnSender";
import {createMondayItem} from "@/lib/mondayCommon";

export async function POST(request) {
    const db = await dbConnect();

    let targetPayees = [];

    try {
        // =========================================================================
        // [STEP 1] 대상 조회
        // =========================================================================
        const query = `
            SELECT A.idx   AS payee_idx,
                   A.user_name,
                   A.biz_name,
                   A.biz_type,
                   A.payout_ratio_id,
                   A.agree_expired_at,
                   B.idx   AS member_idx,
                   B.user_id,
                   B.email AS member_email,
                   B.tel   AS member_tel
            FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} AS A
                     JOIN ${TABLE_NAMES.SBN_MEMBER} AS B ON A.member_idx = B.idx
            WHERE A.agree_mail_state = 'none'
              AND A.agree_expired_at IS NOT NULL
              AND DATEDIFF(A.agree_expired_at, CURDATE()) <= 1
        `;

        const [rows] = await db.execute(query);
        targetPayees = rows;

    } catch (error) {
        console.error("Target Fetch Error:", error);
        return NextResponse.json({error: error.message}, {status: 500});
    } finally {
        // [중요] 조회용 연결 반납 (트랜잭션 들어가기 전에 반납하여 리소스 확보)
        if (db) db.release();
    }

    if (!targetPayees || targetPayees.length === 0) {
        return NextResponse.json({message: "No targets to process."});
    }

    // =========================================================================
    // [STEP 2] 루프 처리
    // =========================================================================
    const results = [];
    const reqCols = MONDAY_COLUMN_IDS.PAYEE_REQUEST;
    const reqLabels = MONDAY_LABEL.PAYEE_REQUEST;

    for (const payee of targetPayees) {
        // 2. [트랜잭션용] 개별 연결 가져오기
        // 루프 돌 때마다 새로운 연결을 가져와서 트랜잭션을 격리합니다.
        const conn = await dbConnect();

        let newMondayItemId = 0;

        try {
            // -------------------------------------------------------------
            // [STEP 2-1] 이메일 발송
            // -------------------------------------------------------------
            const displayName =
                payee.biz_type === "individual"
                    ? payee.user_name
                    : payee.biz_name || payee.user_name;

            // 템플릿 파라미터 (이메일, 카카오 공통 사용 가능)
            const sendParams = {
                template_id: 'cr_email_003', // 이메일 템플릿
                template_code: 'cr_console_003', // 카카오 알림톡 템플릿
                expired_date: new Date(payee.agree_expired_at).toISOString().split('T')[0],
            };

            const emailResult = await sendNHNEmail(payee.member_email, displayName, sendParams);
            if (emailResult.success) console.log(`📧 Email Sent: ${payee.member_email}`);
            else console.error(`❌ Email Fail: ${payee.member_email} (${emailResult.message})`);

            // -------------------------------------------------------------
            // [STEP 2-2] 카카오 알림톡 발송 (전화번호 있을 때만)
            // -------------------------------------------------------------
            // [변경] 카카오는 조건부 발송이므로 기본값을 'none'으로 설정
            let kakaoData = { status: 'none', message: null };

            if (payee.member_tel && payee.member_tel.length > 9) {
                const kRes = await sendNHNKakao(payee.member_tel, sendParams);

                // 결과 매핑 (성공/실패 여부에 따라 status 결정)
                kakaoData = {
                    status: kRes.success ? 'success' : 'fail',
                    message: kRes.message || null
                };

                if (kRes.success) console.log(`💬 Kakao Sent: ${payee.member_tel}`);
                else console.error(`❌ Kakao Fail: ${payee.member_tel} (${kRes.message})`);
            }

            // 최종 처리 상태 (이메일 성공 여부 기준)
            const processStatus = emailResult.success ? "complete" : "fail";
            const mondayStatusLabel = emailResult.success ? reqLabels.REQUEST_STATE.SENT : reqLabels.REQUEST_STATE.FAILED;

            // -------------------------------------------------------------
            // [STEP 3-4] Monday.com 아이템 생성
            // -------------------------------------------------------------
            const linkedItemId = parseInt(payee.payout_ratio_id) || null;

            const columnValues = {
                [reqCols.EMAIL]: {
                    email: payee.member_email,
                    text: payee.member_email,
                },
                [reqCols.PHONE]: {
                    phone: payee.member_tel,
                    countryShortName: "KR",
                },
                [reqCols.STATUS]: mondayStatusLabel,
                [reqCols.PAYEE_REGISTER_STATE]:
                reqLabels.PAYEE_REGISTER_STATE.REGISTERED,
                [reqCols.AGREE_STATE]: reqLabels.AGREE_STATE.REQUESTED,
                ...(linkedItemId && {
                    [reqCols.PAYEE_INFO]: {item_ids: [linkedItemId]},
                }),
            };

            try {
                newMondayItemId = await createMondayItem(
                    MONDAY_BOARD_IDS.PAYEE_REQUEST,
                    displayName,
                    columnValues
                );
            } catch (mondayErr) {
                console.error(`⚠️ Monday Creation Failed:`, mondayErr.message);
                // 실패 시 newMondayItemId는 0 유지 (DB에는 0으로 저장됨)
            }

            // -------------------------------------------------------------
            // [STEP 3-5] DB 트랜잭션 (Request Insert -> Log Insert -> Update)
            // -------------------------------------------------------------
            await conn.beginTransaction();

            // 1. 요청 이력(sb_cr_console_payee_request) INSERT
            // insertId를 받기 위해 execute 결과를 변수에 담음
            const [insertResult] = await conn.execute(
                `INSERT INTO ${TABLE_NAMES.SBN_PAYEE_REQUEST}
                     (item_id, email, tel, email_state, kakao_state, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                    newMondayItemId || 0,
                    payee.member_email || null,
                    payee.member_tel || null,
                    emailResult.success ? "success" : "fail",
                    kakaoData.status || 'none',
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
                    TABLE_NAMES.SBN_PAYEE_REQUEST,
                    requestIdx,
                    payee.member_email || null,
                    emailResult.success ? "success" : "fail",
                    emailResult.message || null,
                    payee.member_tel || null,
                    kakaoData.status || 'none',
                    kakaoData.message || null,
                ]
            );

            // 3. 수취인 정보(sb_cr_console_member_payee) UPDATE
            await conn.execute(
                `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE}
                 SET agree_mail_state = ?,
                     updated_at       = NOW()
                 WHERE idx = ?`,
                [processStatus, payee.payee_idx]
            );

            await conn.commit();
            results.push({ idx: payee.payee_idx, status: processStatus });
        } catch (innerError) {
            if (conn) await conn.rollback();
            console.error(`❌ Process Error for payee idx ${payee.payee_idx}:`, innerError.message);
            results.push({ idx: payee.payee_idx, status: "error", error: innerError.message });
        } finally {
            if (conn) conn.release();
        }
    }

    return NextResponse.json({
        message: "Process completed",
        total_targets: targetPayees.length,
        results: results,
    });
}
