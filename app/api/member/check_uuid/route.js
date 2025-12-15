export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
import { NextResponse } from 'next/server';

export async function POST(request) {
    let connection;

    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { message: 'Token is required' },
                { status: 400 }
            );
        }

        connection = await dbConnect();

        // 1. UUID(user_id)로 사용자 조회
        // 조건: user_id가 일치하고, 아직 활성화되지 않은(inactive) 상태여야 함
        // (이미 가입 완료된 계정으로 다시 들어오는 것을 막으려면 inactive 조건 필요)
        const [rows] = await connection.execute(
            `SELECT email, active_status FROM ${TABLE_NAMES.SBN_MEMBER} WHERE user_id = ?`,
            [token]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: '유효하지 않은 링크입니다.' },
                { status: 404 } // Not Found
            );
        }

        const member = rows[0];

        // 2. 이미 활성화된 계정인지 체크 (선택 사항이지만 보안상 권장)
        if (member.active_status === 'active') {
            return NextResponse.json(
                { message: '이미 가입이 완료된 계정입니다. 로그인 페이지로 이동합니다.' },
                { status: 409 } // Conflict
            );
        }

        // 3. 유효한 토큰인 경우 이메일 반환
        return NextResponse.json(
            {
                valid: true,
                email: member.email,
                message: '유효한 접근입니다.'
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('UUID 검증 중 서버 오류 발생:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}