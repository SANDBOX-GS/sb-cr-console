import { NextResponse } from "next/server";
import { getNotionPage } from "@/lib/notion";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
        return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    const recordMap = await getNotionPage(pageId);
    return NextResponse.json(recordMap);
}
