"use client";

import { motion } from "framer-motion";
import svgPaths from "../imports/svg-dfaq4i8l7r";
import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";

export function Footer() {
    return (
        <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between size-full bg-white shadow shadow-sky-900/15 shadow-[0_-4px_16px]">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                <Image
                    src={`${IMG_URL}/common/symbol_gray_46.png`}
                    width="46"
                    height="32"
                />
                <div>
                    <div className="flex flex-col md:flex-row md:gap-2">
                        <p className="text-sm text-neutral-500">
                            (주)샌드박스네트워크 서울시 용산구 서빙고로 17
                            센트럴타워 28~29F
                        </p>
                        <p className="text-sm text-neutral-500">
                            사업자등록번호 : 220-88-89136
                        </p>
                    </div>
                    <p className="text-sm text-neutral-400">
                        © 2026. SANDBOX NETWORK Inc. All Rights Reserved
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-start md:items-center justify-start md:justify-end w-full md:max-w-[280px] pt-6 md:pt-0">
                <div className="flex items-start justify-start md:justify-end md:items-center gap-6 w-full ">
                    <a
                        href="/notice"
                        className="cursor-pointer hover:text-sky-500 active:text-sky-700 text-sm text-neutral-600"
                    >
                        공지사항
                    </a>
                    <a
                        href="/legal/terms"
                        className="cursor-pointer hover:text-sky-500 active:text-sky-700 text-sm text-neutral-600"
                    >
                        이용약관
                    </a>
                    <a
                        href="/legal/privacy"
                        className="cursor-pointer hover:text-sky-500 active:text-sky-7000 text-sm text-neutral-600"
                    >
                        개인정보처리방침
                    </a>
                </div>
                <div className="flex items-center gap-2 w-full justify-start md:justify-end">
                    <svg className="size-3" fill="none" viewBox="0 0 12 12">
                        <path
                            d={svgPaths.pcd45380}
                            stroke="var(--stroke-0, #94A3B8)"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d={svgPaths.p9deeb00}
                            stroke="var(--stroke-0, #94A3B8)"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <p className="text-sm text-neutral-500">
                        contact@sandboxnetwork.net
                    </p>
                </div>
            </div>
        </div>
    );
}
