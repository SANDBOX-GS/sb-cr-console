"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

// 기본 렌더러 (SSR off)
const NotionRenderer = dynamic(
    () => import("react-notion-x").then((m) => m.NotionRenderer),
    { ssr: false }
);

// 선택 컴포넌트들
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
        <NotionRenderer
            recordMap={recordMap}
            fullPage={false}
            darkMode={false}
            components={{
                Code,
                Collection,
                Equation,
                Pdf,
                Modal,
                // next/image를 쓰고 싶으면 react-notion-x 문서 패턴에 맞춰 커스텀 가능
                nextImage: Image,
            }}
        />
    );
};
