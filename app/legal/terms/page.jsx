import { getNotionPage } from "@/lib/notion";
import { NotionPage } from "@/components/common/NotionPage";
import { NOTION_PAGE_ID } from "@/constants/dbConstants";

export const revalidate = 60 * 60; // 1h

export default async function TermsPage() {
    const recordMap = await getNotionPage(NOTION_PAGE_ID.TERMS);

    return (
        <main className="mx-auto max-w-3xl px-4 py-10">
            <NotionPage recordMap={recordMap} />
        </main>
    );
}
