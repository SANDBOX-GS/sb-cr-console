// app/notion/[pageId]/page.tsx
import { getNotionPage } from "@/lib/notion";
import { NotionPage } from "@/components/common/NotionPage";

export default async function NoticeDetail({ params }) {
    const { pageId } = await params; // ✅ Promise unwrap

    try {
        const recordMap = await getNotionPage(pageId); // ✅ params.id 아님
        return (
            <main className="mx-auto w-full px-4 py-10">
                <NotionPage recordMap={recordMap} />
            </main>
        );
    } catch (e) {
        console.error("❌ Notion fetch failed", { pageId, error: e });
        throw e; // 기존 에러페이지로 보내든, notFound()로 보내든 선택
    }
}
