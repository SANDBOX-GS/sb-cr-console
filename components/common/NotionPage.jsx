"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";

const NotionRenderer = dynamic(
    () => import("react-notion-x").then((m) => m.NotionRenderer),
    { ssr: false }
);

const Code = dynamic(
    () => import("react-notion-x/build/third-party/code").then((m) => m.Code),
    { ssr: false }
);
const Collection = dynamic(
    () =>
        import("react-notion-x/build/third-party/collection").then(
            (m) => m.Collection
        ),
    { ssr: false }
);
const Equation = dynamic(
    () =>
        import("react-notion-x/build/third-party/equation").then(
            (m) => m.Equation
        ),
    { ssr: false }
);
const Pdf = dynamic(
    () => import("react-notion-x/build/third-party/pdf").then((m) => m.Pdf),
    { ssr: false }
);
const Modal = dynamic(
    () => import("react-notion-x/build/third-party/modal").then((m) => m.Modal),
    { ssr: false }
);

export const NotionPage = ({ recordMap }) => {
    return (
        <main className="mx-auto px-4 py-10 w-full max-w-[821px] overflow-x-hidden bg-white rounded-xl shadow shadow-sky-900/15 shadow-[0_-4px_16px]">
            <NotionRenderer
                recordMap={recordMap}
                fullPage={false}
                darkMode={false}
                mapPageUrl={(pageId) => `/notice/${pageId}`}
                components={{
                    Code,
                    Collection,
                    Equation,
                    Pdf,
                    Modal,
                    nextImage: Image,
                }}
            />
            <div className="w-full justify-end flex">
                <Image
                    className="mt-10"
                    src={`${IMG_URL}/common/logo_horizontal_navy.png`}
                    width={114}
                    height={14}
                />
            </div>
        </main>
    );
};
