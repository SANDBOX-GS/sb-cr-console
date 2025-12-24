import { NotionAPI } from "notion-client";

const notion = new NotionAPI();

export const getNotionPage = async (pageId) => {
    if (!pageId) throw new Error("Missing Notion pageId");
    const recordMap = await notion.getPage(pageId);
    return recordMap;
};
