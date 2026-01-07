"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "react-notion-x/src/styles.css";
import "prismjs/themes/prism.css";
import "katex/dist/katex.min.css";
import Loading from "@/app/loading";

// NotionPage 컴포넌트 안 쓰고, 여기서 바로 NotionRenderer 로딩
const NotionRenderer = dynamic(
    () => import("react-notion-x").then((m) => m.NotionRenderer),
    { ssr: false }
);

export default function NotionModalContents({ title, pageId }) {
    const [recordMap, setRecordMap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const url = useMemo(() => {
        if (!pageId) return "";
        return `/api/notion/get-page?pageId=${encodeURIComponent(pageId)}`;
    }, [pageId]);

    useEffect(() => {
        if (!url) return;

        let alive = true;

        const run = async () => {
            try {
                setError("");
                setLoading(true);

                const res = await fetch(url, {
                    // 브라우저 캐시만 방지. 서버쪽 unstable_cache(180초)가 기준이 됩니다.
                    cache: "no-store",
                });

                if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    throw new Error(msg || "Failed to fetch notion recordMap");
                }

                const data = await res.json();
                if (alive) setRecordMap(data);
            } catch (e) {
                console.error(e);
                if (alive) {
                    setRecordMap(null);
                    setError("문서를 불러오지 못했습니다.");
                }
            } finally {
                if (alive) setLoading(false);
            }
        };

        run();

        return () => {
            alive = false;
        };
    }, [url]);

    if (loading)
        return (
            <div className="">
                <Loading />
            </div>
        );
    if (error) return <div className="p-6 text-sm text-red-500">{error}</div>;
    if (!recordMap) return null;

    return (
        <div className="overflow-y-auto">
            {/* title은 DialogHeader에서 쓰면 되고, 여기서는 본문만 렌더해도 됩니다 */}
            <NotionRenderer
                recordMap={recordMap}
                fullPage={false}
                darkMode={false}
            />
        </div>
    );
}
