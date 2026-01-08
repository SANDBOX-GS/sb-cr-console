"use client";
import React from "react";
import { Button } from "@/components/common/Button";
import { useRouter } from "@/hooks/useRouter";
import { motion } from "framer-motion";
import { IMG_URL } from "@/constants/dbConstants";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

const Index = () => {
    const { navigate } = useRouter();
    const { isLoggedIn } = useAuth();
    const navigateToStart = () => {
        if (isLoggedIn) {
            navigate("/payee-info/view");
        } else {
            navigate("/payee-info/register");
        }
    };
    return (
        <div className="w-full h-full flex flex-col items-center justify-center mt-40 gap-8">
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12 flex flex-col items-center gap-6"
            >
                <Image
                    src={`${IMG_URL}/common/symbol_120.png`}
                    width={120}
                    height={83}
                    alt="no image"
                    unoptimized
                />
                <h1 className="text-slate-800">
                    샌드박스 크리에이터
                    <br /> 정산 시스템
                </h1>

                <p className="mt-4 text-slate-500 max-w-lg mx-auto">
                    크리에이터 정산 시스템에 오신 것을 환영합니다.
                    <br />
                    정산 시스템은 샌드박스와 함께 협업하고 있는
                    <br /> 파트너 크리에이터분들만 접근이 가능한 프라이빗
                    플랫폼입니다.
                </p>
            </motion.div>
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="w-[240px]"
            >
                <Button onClick={navigateToStart} className="w-full">
                    시작하기
                </Button>
            </motion.div>
        </div>
    );
};

export default Index;
