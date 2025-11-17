import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const SESSION_MAX_AGE = 60 * 60 * 8; // 8시간

export async function POST(request) {
    const { email, password } = await request.json();
    let connection;

    try {
        connection = await dbConnect();

        // 1. 사용자 정보 조회
        const [rows] = await connection.execute(
            `SELECT idx, password, active_status FROM ${TABLE_NAMES.SBN_MEMBER} WHERE email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: '이메일 또는 비밀번호가 일치하지 않습니다.' },
                { status: 401 }
            );
        }

        const member = rows[0];

        // 2. 상태 확인 및 비밀번호 비교
        if (member.active_status !== 'active') {
            return NextResponse.json(
                { message: '비활성화된 계정입니다. 계정을 활성화해 주세요.' },
                { status: 403 }
            );
        }

        const passwordMatch = await bcrypt.compare(password, member.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: '이메일 또는 비밀번호가 일치하지 않습니다.' },
                { status: 401 }
            );
        }

        // 3. 로그인 성공 및 HTTP-Only 쿠키 발급
        // Max-Age를 8시간(28800초)으로 설정
        const memberIdxCookie = `member_idx=${member.idx}; Max-Age=${SESSION_MAX_AGE}; Path=/; HttpOnly=true; Secure=true; SameSite=Strict`;

        return new NextResponse(
            JSON.stringify({ message: '로그인 성공', member_idx: member.idx }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': memberIdxCookie,
                },
            }
        );

    } catch (error) {
        console.error('로그인 중 서버 오류 발생:', error);

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