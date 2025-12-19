export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";
import { cookies } from "next/headers";

// ==============================================================================
// POST /api/member/payee_agree
// 수취인 정보 동의(agree_expired_at)를 갱신합니다.
// ==============================================================================
export async function POST(request) {
  let connection;
  console.log("바디", request);
  try {
    // *******************************************************************
    // 0. 세션(쿠키)에서 실제 member_idx 가져오기
    // *******************************************************************
    const cookieStore = await cookies();
    const memberIdxCookie = cookieStore.get("member_idx");

    if (!memberIdxCookie || !memberIdxCookie.value) {
      // ... (401 응답)
      return new Response(
        JSON.stringify({
          success: false,
          message: "인증 정보가 없습니다. 다시 로그인해 주세요.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const member_idx = parseInt(memberIdxCookie.value, 10);
    if (isNaN(member_idx) || member_idx <= 0) {
      // ... (401 응답)
      return new Response(
        JSON.stringify({
          success: false,
          message: "유효하지 않은 사용자 ID입니다.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // *******************************************************************

    // 1. 요청 본문 파싱 (consent_type 추출)
    const { consent_type } = await request.json();
    if (consent_type !== "30days" && consent_type !== "once") {
      // ... (400 응답)
      return new Response(
        JSON.stringify({
          success: false,
          message: "유효하지 않은 동의 유형입니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. 만료일 계산
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 오늘 자정 (날짜 비교용)
    let expiredAtDate = new Date(now);
    let validityStatus = "valid"; // 기본값

    if (consent_type === "30days") {
      // 30일간 동의 유지: 현재 날짜 + 30일
      expiredAtDate.setDate(now.getDate() + 30);
    } else if (consent_type === "once") {
      // 이번만 동의하기: 당일 만료일(오늘)
      // (동의는 완료되었으나, 유효기간은 짧으므로 만료 임박 또는 유효로 처리 가능)
      // 데이터베이스 DATE 형식은 시분초를 포함하지 않으므로, 오늘 날짜로 저장합니다.
      expiredAtDate = today;
      validityStatus = "expiring_soon"; // 당일 만료로 간주하여 임박 상태 설정
    }

    const year = expiredAtDate.getFullYear();
    const month = String(expiredAtDate.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작
    const day = String(expiredAtDate.getDate()).padStart(2, "0");

    const newExpiredAtDBFormat = `${year}-${month}-${day}`;

    // 클라이언트에 전달할 ISO String 형식 (lastModified 계산을 위해 정확한 시간 사용)
    const newExpiredAtISOString = expiredAtDate.toISOString();

    // 3. 데이터베이스 연결 및 쿼리 실행
    connection = await dbConnect();

    // 쿼리 실행: agree_expired_at 및 updated_at 업데이트
    await connection.execute(
      `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET
                agree_expired_at = ?,
                updated_at = NOW()
             WHERE member_idx = ?`,
      [newExpiredAtDBFormat, member_idx]
    );

    // 4. 업데이트된 updated_at (lastModified) 조회
    // updated_at은 NOW()로 설정되었으므로, 이를 다시 조회하여 정확한 ISO 시간을 얻습니다.
    // 또는 쿼리 실행 직후의 현재 시간을 사용합니다. (간결함을 위해 현재 시간 사용)
    const lastModified = new Date().toISOString();

    // 5. 프론트엔드에 필요한 metadata 객체를 포함하여 응답

    // 만료일과 오늘 날짜의 차이 계산 (D-day)
    const expiredDateMidnight = new Date(
      expiredAtDate.getFullYear(),
      expiredAtDate.getMonth(),
      expiredAtDate.getDate()
    );
    const diffTime = expiredDateMidnight.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      validityStatus = "valid";
    } else if (diffDays >= 0 && diffDays <= 1) {
      validityStatus = "expiring_soon";
    } else {
      validityStatus = "expired";
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "정보 수집 동의가 성공적으로 갱신되었습니다.",

        // 🚨🚨🚨 [핵심 수정] metadata 객체 추가 🚨🚨🚨
        metadata: {
          // 클라이언트가 기대하는 유효 기간 종료일 (ISO String)
          validityPeriodEnd: newExpiredAtISOString,

          // 유효 상태 (valid, expiring_soon, expired)
          validityStatus: validityStatus,

          // 최종 수정일 (ISO String)
          lastModified: lastModified,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("수취인 정보 동의 처리 중 오류 발생:", error);

    return new Response(
      JSON.stringify({ success: false, message: "서버 오류가 발생했습니다." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } finally {
    if (connection) {
      connection.end();
    }
  }
}
