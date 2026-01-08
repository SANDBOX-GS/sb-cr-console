import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";
import { cn } from "@/lib/utils";

export function Footer({ className }) {
    return (
        <div
            className={cn(
                "px-6 py-4 flex flex-col md:flex-row items-center justify-between size-full bg-white shadow shadow-sky-900/15 shadow-[0_-4px_16px]",
                className
            )}
        >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full">
                <Image
                    src={`${IMG_URL}/common/symbol_gray_46.png`}
                    width="46"
                    height="32"
                    alt="no image"
                    unoptimized
                />
                <div>
                    <div className="flex flex-col md:flex-row md:gap-2 md:flex-wrap">
                        <p className="text-xs md:text-sm text-neutral-500">
                            (주)샌드박스네트워크 서울시 용산구 서빙고로 17
                            센트럴타워 28~29F
                        </p>
                        <p className="text-xs md:text-sm text-neutral-500">
                            사업자등록번호 : 220-88-89136
                        </p>
                    </div>
                    <p className="text-xs md:text-sm text-neutral-400">
                        © 2026. SANDBOX NETWORK Inc. All Rights Reserved
                    </p>
                </div>
            </div>
            <div className="flex items-start md:items-center justify-start md:justify-end w-full md:max-w-[280px] pt-6 md:pt-0 gap-6">
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
                    className="cursor-pointer hover:text-sky-500 active:text-sky-7000 text-sm text-neutral-700 font-medium"
                >
                    개인정보처리방침
                </a>
            </div>
        </div>
    );
}
