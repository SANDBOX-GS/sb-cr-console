export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
import { cookies } from 'next/headers';

/**
 * GET /api/member/status
 * 클라이언트의 로그인 상태(쿠키)를 확인하고 응답합니다.
 * AuthContext에서 호출되며, 쿠키를 통해 member_idx를 검증합니다.
 * @returns 200 OK (로그인 상태) 또는 401 Unauthorized (로그아웃 상태)
 */
export async function GET() {
    let connection;

    try {
        // 1. 쿠키에서 member_idx 값 가져오기
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get('member_idx');

        if (!memberIdxCookie || !memberIdxCookie.value) {
            // 쿠키가 없으면 바로 미인증 응답 (AuthContext의 isLoggedIn: false 유도)
            return new Response(
                JSON.stringify({ message: 'No authentication cookie found.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const member_idx = parseInt(memberIdxCookie.value, 10);
        if (isNaN(member_idx) || member_idx <= 0) {
            // 쿠키 값이 유효하지 않으면 미인증 응답
            return new Response(
                JSON.stringify({ message: 'Invalid member ID in cookie.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 2. 데이터베이스 연결 및 사용자 상태 확인
        connection = await dbConnect();

        const [rows] = await connection.execute(
            `SELECT idx, active_status FROM ${TABLE_NAMES.SBN_MEMBER} WHERE idx = ?`,
            [member_idx]
        );

        if (rows.length === 0 || rows[0].active_status !== 'active') {
            // DB에 사용자가 없거나 active 상태가 아니면 미인증 응답
            return new Response(
                JSON.stringify({ message: 'User not found or inactive.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // 3. 모든 인증 검증 통과 (로그인 상태 확정)
        return new Response(
            JSON.stringify({ message: 'Authenticated', isLoggedIn: true }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('인증 상태 확인 중 서버 오류 발생:', error);
        return new Response(
            JSON.stringify({ message: 'Server error during authentication check.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    } finally {
        if (connection) {
            connection.end();
        }
    }
}