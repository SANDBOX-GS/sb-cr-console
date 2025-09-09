"use client";

import {motion} from "framer-motion";
import svgPaths from "../imports/svg-dfaq4i8l7r";

export function Footer() {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl relative shrink-0 w-full border-t border-slate-200/50"
        >
            <div className="flex flex-row items-center overflow-clip relative size-full">
                <div className="box-border content-stretch flex items-center justify-between px-8 py-4 relative w-full">
                    <div className="content-stretch flex gap-5 items-center justify-start relative shrink-0">
                        <div className="flex items-center justify-center relative shrink-0">
                            <div className="flex-none scale-y-[-100%]">
                                <div className="h-8 relative w-[46.233px]">
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47 32">
                                        <path d={svgPaths.p2b99d040} fill="var(--fill-0, #64748B)" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div className="content-stretch flex flex-col font-['Pretendard:Regular',_sans-serif] items-start justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-400">
                            <div className="content-stretch flex gap-2 items-center justify-start relative shrink-0">
                                <div className="relative shrink-0">
                                    <p className="leading-[1.6] text-nowrap whitespace-pre">(주)샌드박스네트워크</p>
                                </div>
                                <div className="relative shrink-0">
                                    <p className="leading-[1.6] text-nowrap whitespace-pre">서울시 용산구 서빙고로 17 센트럴타워 28~30F</p>
                                </div>
                                <div className="relative shrink-0">
                                    <p className="leading-[1.6] text-nowrap whitespace-pre">사업자등록번호 : 220-88-89136</p>
                                </div>
                            </div>
                            <div className="relative shrink-0">
                                <p className="leading-[1.6] text-nowrap whitespace-pre">© 2025. SANDBOX NETWORK Inc. All Rights Reserved</p>
                            </div>
                        </div>
                    </div>
                    <div className="content-stretch flex flex-col items-end justify-center relative shrink-0">
                        <div className="content-stretch flex gap-4 items-start justify-start leading-[0] not-italic relative shrink-0 text-[13px] text-nowrap text-slate-500 w-full">
                            <div className="font-['Pretendard:Regular',_sans-serif] relative shrink-0 hover:text-slate-700 transition-colors duration-200 cursor-pointer">
                                <p className="leading-[1.6] text-nowrap whitespace-pre">공지사항</p>
                            </div>
                            <div className="font-['Pretendard:Regular',_sans-serif] relative shrink-0 hover:text-slate-700 transition-colors duration-200 cursor-pointer">
                                <p className="leading-[1.6] text-nowrap whitespace-pre">이용약관</p>
                            </div>
                            <div className="font-['Pretendard:Medium',_sans-serif] relative shrink-0 hover:text-slate-700 transition-colors duration-200 cursor-pointer">
                                <p className="leading-[1.6] text-nowrap whitespace-pre">개인정보처리방침</p>
                            </div>
                        </div>
                        <div className="content-stretch flex gap-1 items-center justify-center relative shrink-0">
                            <svg className="size-3" fill="none" viewBox="0 0 12 12">
                                <path d={svgPaths.pcd45380} stroke="var(--stroke-0, #94A3B8)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d={svgPaths.p9deeb00} stroke="var(--stroke-0, #94A3B8)" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="font-['Pretendard:Regular',_sans-serif] leading-[0] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-400">
                                <p className="leading-[1.6] whitespace-pre">contact@sandboxnetwork.net</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}