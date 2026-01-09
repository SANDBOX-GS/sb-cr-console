export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    let connection;

    try {
        // 0. 쿠키에서 member_idx
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        if (!memberIdxCookie?.value) {
            return NextResponse.json(
                { message: "인증 정보가 없습니다. 다시 로그인해 주세요." },
                { status: 401 }
            );
        }

        const memberIdx = Number(memberIdxCookie.value);
        if (!Number.isInteger(memberIdx) || memberIdx <= 0) {
            return NextResponse.json(
                { message: "유효하지 않은 사용자 ID입니다." },
                { status: 401 }
            );
        }

        // 1. DB 연결
        connection = await dbConnect();

        // 2. 회원 기본 정보 조회
        const [rows] = await connection.query(
            `
      SELECT
        email,
        tel,
        cr_inv_name,
        created_at
      FROM ${TABLE_NAMES.SBN_MEMBER}
      WHERE idx = ?
      LIMIT 1
      `,
            [memberIdx]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                {
                    email: null,
                    tel: null,
                    cr_inv_name: null,
                    created_at: null,
                    message: "회원 정보를 찾을 수 없습니다.",
                },
                { status: 200 }
            );
        }

        const row = rows[0];

        return NextResponse.json(
            {
                email: row.email,
                tel: row.tel,
                cr_inv_name: row.cr_inv_name,
                created_at: row.created_at
                    ? new Date(row.created_at).toISOString()
                    : null,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/member/basic error:", error);

        return NextResponse.json(
            {
                message: "서버 오류로 정보를 불러올 수 없습니다.",
            },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
