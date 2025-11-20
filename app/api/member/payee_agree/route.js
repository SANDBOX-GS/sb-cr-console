import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
// 💡 Next.js 서버 환경에서 쿠키를 사용하기 위해 next/server에서 가져옵니다.
import { NextResponse, cookies } from 'next/server';

// ==============================================================================
// 💡 getMemberIdxFromToken 함수는 쿠키 사용으로 대체되어 제거되었습니다.
// ==============================================================================

export async function POST(request) {
    let connection;

    try {
        // *******************************************************************
        // 🚨 0. 세션(쿠키)에서 실제 member_idx 가져오기 (사용자 요청 반영)
        // *******************************************************************
        // cookies() 함수는 async/await가 필요하지 않습니다.
        const cookieStore = cookies();
        const memberIdxCookie = cookieStore.get('member_idx');

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return new Response(
                JSON.stringify({ success: false, message: '인증 정보가 없습니다. 다시 로그인해 주세요.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const member_idx = parseInt(memberIdxCookie.value, 10);
        if (isNaN(member_idx) || member_idx <= 0) {
            return new Response(
                JSON.stringify({ success: false, message: '유효하지 않은 사용자 ID입니다.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }
        // *******************************************************************

        // 2. 요청 본문 파싱 (consent_type 추출)
        const { consent_type } = await request.json();

        if (consent_type !== '30days' && consent_type !== 'once') {
            return new Response(
                JSON.stringify({ success: false, message: '유효하지 않은 동의 유형입니다.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 3. 만료일 계산
        const now = new Date();
        let expiredAtDate = new Date(now);

        if (consent_type === '30days') {
            // 30일간 동의 유지: 현재 날짜 + 30일
            expiredAtDate.setDate(now.getDate() + 30);
        } else if (consent_type === 'once') {
            // 이번만 동의하기: 일반적으로 장기간 (예: 1년) 만료일을 설정하여 갱신 효과를 줍니다.
            expiredAtDate.setFullYear(now.getFullYear() + 1);
        }

        // DATE 형식에 맞게 YYYY-MM-DD 형식으로 포맷
        const newExpiredAt = expiredAtDate.toISOString().split('T')[0];

        connection = await dbConnect();

        // 4. 동의 만료일 (agree_expired_at) 업데이트 쿼리 실행
        await connection.execute(
            `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET
                agree_expired_at = ?,
                updated_at = NOW()
             WHERE member_idx = ?`,
            [newExpiredAt, member_idx]
        );

        return new Response(JSON.stringify({
            success: true,
            message: '정보 수집 동의가 성공적으로 갱신되었습니다.',
            new_expired_at: newExpiredAt
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('수취인 정보 동의 처리 중 오류 발생:', error);

        return new Response(JSON.stringify({ success: false, message: '서버 오류가 발생했습니다.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        if (connection) {
            connection.end();
        }
    }
}