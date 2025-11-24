"use client";

import {motion} from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function Header () {
    const router = useRouter();
    const { isLoggedIn, logout, isLoading } = useAuth();

    const handleAuthClick = () => {
        if (isLoading) return; // 로딩 중에는 클릭 방지

        if (isLoggedIn) {
            logout();
        } else {
            console.log("Not logged in, navigating to /login");
            router.push('/login');
        }
    };

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl h-[66px] relative shrink-0 w-full border-b border-slate-200/50"
        >
            <div className="flex flex-row items-center overflow-clip relative size-full">
                <div className="box-border content-stretch flex h-[66px] items-center justify-between px-8 py-4 relative w-full">
                    <div className="bg-center bg-cover bg-no-repeat h-5 shrink-0 w-[162px]" style={{ backgroundImage: `url('/logo.svg')` }} />
                    <div className="content-stretch flex gap-10 items-center justify-start relative shrink-0">
                        <div className="box-border content-stretch flex gap-2.5 h-8 items-center justify-center px-3 py-1 relative rounded-lg shrink-0 hover:bg-slate-100/80 transition-all duration-200 cursor-pointer">
                            <div
                                className="box-border content-stretch flex gap-2.5 h-8 items-center justify-center px-3 py-1 relative rounded-lg shrink-0 hover:bg-slate-100/80 transition-all duration-200 cursor-pointer"
                                onClick={handleAuthClick}
                            >
                                <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0">
                                    <div className="font-['Pretendard:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[13px] text-center text-nowrap text-slate-700">
                                        <p className="leading-[1.6] whitespace-pre">
                                            {isLoading ? '확인 중...' : (isLoggedIn ? '로그아웃' : '로그인')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}