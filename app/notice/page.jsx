import { getNotionPage } from "@/lib/notion";
import { NotionPage } from "@/components/common/NotionPage";
import { NOTION_PAGE_ID } from "@/constants/dbConstants";

export const revalidate = 60 * 60; // 1h

export default async function NoticePage() {
    const recordMap = await getNotionPage(NOTION_PAGE_ID.NOTICE);
    const collectionId = Object.keys(recordMap.collection || {})[0];
    const viewId = Object.keys(recordMap.collection_view || {})[0];

    const view = recordMap.collection_view?.[viewId]?.value;
    const tableProps = view?.format?.table_properties || [];

    console.log("table_properties", tableProps);

    const collection = recordMap.collection?.[collectionId]?.value;
    console.log("schema keys", Object.keys(collection?.schema || {}));

    return (
        <main className="mx-auto max-w-3xl px-4 py-10">
            <NotionPage recordMap={recordMap} />
        </main>
    );
}
