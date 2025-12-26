import { getNotionPage } from "@/lib/notion";
import { NotionPage } from "@/components/common/NotionPage";
import { NOTION_PAGE_ID } from "@/constants/dbConstants";

export default async function PrivacyPage() {
    const recordMap = await getNotionPage(NOTION_PAGE_ID.PRIVACY);

    return (
        <main className="mx-auto w-full px-4 py-10">
            <NotionPage recordMap={recordMap} />
        </main>
    );
}
