export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

/**
 * POST 요청으로 로그아웃을 처리합니다.
 *
 * 로그인 시 발급된 HTTP-Only 쿠키(member_idx)를 만료시켜 세션을 종료합니다.
 *
 * @returns {NextResponse} 로그아웃 성공 메시지 및 만료된 쿠키를 포함하는 응답
 */

export async function POST() {
    // 1. 쿠키 만료를 위한 Set-Cookie 헤더 생성
    // 기존의 member_idx 쿠키를 Max-Age=0 혹은 만료일을 과거로 설정하여 즉시 만료시킵니다.
    // 다른 속성(Path, HttpOnly, Secure, SameSite)은 설정 시와 동일하게 유지하는 것이 안전합니다.
    const expiredCookie = `member_idx=; Max-Age=0; Path=/; HttpOnly=true; Secure=true; SameSite=Strict`;

    try {
        // 2. 만료된 쿠키를 포함하는 응답 반환
        return new NextResponse(
            JSON.stringify({ message: '로그아웃 성공' }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    // 클라이언트 브라우저에게 member_idx 쿠키를 삭제하도록 지시
                    'Set-Cookie': expiredCookie,
                },
            }
        );
    } catch (error) {
        console.error('로그아웃 중 서버 오류 발생:', error);
        return NextResponse.json(
            { message: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}