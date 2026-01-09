import { Box } from "../common/Box";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STEPS = [
    {
        id: 1,
        step: "guide",
        title: "등록 가이드",
        desc: "수취 정보 등록 절차 안내",
    },
    {
        id: 2,
        step: "biz",
        title: "사업자 구분",
        desc: "사업자 구분 및 영수증 발행 유형",
    },
    {
        id: 3,
        step: "payee",
        title: "세무 정보",
        desc: "개인·사업자 정보, 연락처 입력",
    },
];

export const ProgressItem = ({ activeStep = "1" }) => {
    return (
        <div className="flex justify-between text-center w-full">
            {STEPS.map((step) => {
                const isActive = activeStep === step.step;
                return (
                    <div
                        key={step.id}
                        className={
                            isActive
                                ? "flex flex-col items-center justify-center gap-2 after:left-0 after:bottom-0 after:w-full after:h-1 after:bg-primary-gradient w-full max-w-[240px]"
                                : "flex flex-col items-center justify-start gap-2 w-full  max-w-[240px]"
                        }
                    >
                        {/* 번호 뱃지 */}
                        <div
                            className={
                                isActive
                                    ? "flex rounded-full text-[1.125rem] h-8 px-6 text-white bg-primary-gradient border border-sky-400 justify-center items-center"
                                    : "flex font-medium text-[1.125rem] bg-sky-100 h-8 rounded-full text-slate-500 border border-sky-200 w-8 justify-center items-center"
                            }
                        >
                            {step.id}
                        </div>

                        {/* 제목 */}
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={
                                    isActive
                                        ? "text-slate-700 font-bold text-sm md:text-base"
                                        : "text-slate-600 font-medium text-sm md:text-base"
                                }
                            >
                                {step.title}
                            </div>

                            {/* 설명 */}
                            <div className="text-sm text-slate-400 md:block hidden">
                                {step.desc}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default function ProgressBar({ currentStep }) {
    const currentStepIndex = currentStep;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-12"
        >
            {/* Progress Container */}
            <Box className="relative">
                {/* Progress Bar Background */}

                {/* Steps */}
                <div className="relative flex items-center justify-bteween">
                    <ProgressItem activeStep={currentStepIndex} />
                </div>
            </Box>
        </motion.div>
    );
}
