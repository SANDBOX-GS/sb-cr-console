"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";
import { cn } from "@/lib/utils";

export function Header({ className }) {
    const router = useRouter();
    const { isLoggedIn, logout, isLoading } = useAuth();

    const handleAuthClick = () => {
        if (isLoading) return; // 로딩 중에는 클릭 방지

        if (isLoggedIn) {
            logout();
        } else {
            console.log("Not logged in, navigating to /login");
            router.push("/login");
        }
    };

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "bg-white backdrop-blur-xl h-[66px] relative shrink-0 w-full border-b border-slate-200/50 shadow-sky-900/15 shadow-[0_4px_16px]",
                className
            )}
        >
            <div className="flex flex-row items-center overflow-clip relative size-full">
                <div className="box-border content-stretch flex h-[66px] items-center justify-between px-8 py-4 relative w-full">
                    <a href="/">
                        <Image
                            src={`${IMG_URL}/common/logo_horizontal.png`}
                            width="162"
                            height="20"
                            className="hidden md:block"
                        />
                        <Image
                            src={`${IMG_URL}/common/symbol_40.png`}
                            width="29"
                            height="20"
                            className="md:hidden"
                        />
                    </a>
                    <div className="content-stretch flex gap-10 items-centerㄴ justify-start relative shrink-0">
                        <div
                            className="text-sm box-border content-stretch flex gap-2.5 h-8 items-center justify-center md:px-3 py-1 relative rounded-lg shrink-0 hover:bg-slate-100/80 transition-all duration-200 cursor-pointer"
                            onClick={handleAuthClick}
                        >
                            <div className="content-stretch flex gap-1 items-center justify-start relative shrink-0">
                                {isLoading
                                    ? "확인 중..."
                                    : isLoggedIn
                                    ? "로그아웃"
                                    : "로그인"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
