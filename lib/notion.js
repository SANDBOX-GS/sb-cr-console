import { NotionAPI } from "notion-client";

const notion = new NotionAPI();

const normalizePageId = (id) => id.replace(/-/g, "");

export const getNotionPage = async (pageId) => {
    if (!pageId) throw new Error("Missing Notion pageId");

    const normalized = normalizePageId(pageId);
    const recordMap = await notion.getPage(normalized, {
        fetchCollections: true,
    });
    return recordMap;
};
