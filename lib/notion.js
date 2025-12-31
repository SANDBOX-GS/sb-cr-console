import { unstable_cache } from "next/cache";
import { NotionAPI } from "notion-client";

const notion = new NotionAPI();

const normalizePageId = (id) => id.replace(/-/g, "");

export const getNotionPage = unstable_cache(
    async (pageId) => {
        if (!pageId) throw new Error("Missing Notion pageId");

        const normalized = normalizePageId(pageId);
        const recordMap = await notion.getPage(normalized, {
            fetchCollections: true,
        });
        return recordMap;
    },
    (pageId) => ["notion-page", pageId],
    { revalidate: 180 }
);
