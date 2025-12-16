"use client";
import { motion } from "framer-motion";
import {
    InfoIcon,
    CreditCardIcon,
    FileTextIcon,
    Check as CheckIcon,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const STEPS = [
    // ... (STEPS array is the same)
    {
        id: "guide",
        label: "안내사항",
        icon: InfoIcon,
        description: "서비스 소개 및 등록 안내",
    },
    {
        id: "account",
        label: "계좌정보",
        icon: CreditCardIcon,
        description: "수취정보 및 계좌",
    },
    {
        id: "tax",
        label: "세무정보",
        icon: FileTextIcon,
        description: "세무 관련 정보",
    },
];

function StepItem({ step, isActive, isCompleted, onClick, isLast }) {
    const IconComponent = step.icon;

    return (
        <div className="flex items-center flex-1">
            {/* Step Container */}
            <motion.button
                type="button" // ✅ 핵심 수정: type="button"을 추가하여 form 제출을 방지합니다.
                onClick={onClick}
                className={`
          relative flex flex-col items-center min-w-0 flex-1 group cursor-pointer
          ${isActive ? "z-10" : "z-0"}
        `}
                // ... (rest of the file is the same)
            >
                {/* Step Circle */}
                <motion.div
                    className={`
            relative w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300
            ${
                        isCompleted
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                            : isActive
                                ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25"
                                : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-500"
                    }
          `}
                    animate={{
                        scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Background glow for active/completed */}
                    {(isActive || isCompleted) && (
                        <motion.div
                            className={`
                absolute inset-0 rounded-full blur-lg opacity-30
                ${isCompleted ? "bg-green-500" : "bg-sky-500"}
              `}
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    )}

                    {/* Step Number or Icon */}
                    <div className="relative">
                        {isCompleted ? (
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    bounce: 0.5,
                                    duration: 0.6,
                                }}
                            >
                                <CheckIcon className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <IconComponent className="w-5 h-5" />
                        )}
                    </div>
                </motion.div>

                {/* Step Content */}
                <div className="text-center min-w-0">
                    <div
                        className={`
            transition-all duration-300 mb-1 font-medium
            ${
                            isActive
                                ? "text-slate-800"
                                : isCompleted
                                    ? "text-slate-700"
                                    : "text-slate-500 group-hover:text-slate-600"
                        }
          `}
                    >
                        {step.label}
                    </div>
                    <div
                        className={`
            text-xs transition-all duration-300
            ${
                            isActive
                                ? "text-slate-600"
                                : isCompleted
                                    ? "text-slate-500"
                                    : "text-slate-400 group-hover:text-slate-500"
                        }
          `}
                    >
                        {step.description}
                    </div>
                </div>
            </motion.button>

            {/* Connecting Line */}
            {!isLast && (
                <div className="flex-1 h-px mx-4 relative">
                    <motion.div
                        className={`
              absolute inset-0 transition-all duration-500
              ${
                            isCompleted
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : "bg-slate-200"
                        }
            `}
                        initial={{ scaleX: 0 }}
                        animate={{
                            scaleX: isCompleted ? 1 : 0,
                        }}
                        style={{ transformOrigin: "left" }}
                        transition={{
                            duration: 0.5,
                            delay: isCompleted ? 0.2 : 0,
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default function ProgressTabs({
                                         currentStep,
                                         onStepChange,
                                         completedSteps,
                                     }) {
    const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-12"
        >
            {/* Progress Header */}
            <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">
                    수취인 정보 등록 진행 상황
                </h2>
                <p className="text-sm text-slate-600">
                    {currentStepIndex + 1}단계 / {STEPS.length}단계 -{" "}
                    {STEPS[currentStepIndex]?.label}
                </p>
            </div>

            {/* Progress Container */}
            <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/30 rounded-2xl pointer-events-none" />

                {/* Progress Bar Background */}
                <div className="relative">
                    <div className="absolute top-6 left-6 right-6 h-px bg-slate-200 pointer-events-none">
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-sky-500 to-cyan-500"
                            initial={{ scaleX: 0 }}
                            animate={{
                                scaleX: currentStepIndex / (STEPS.length - 1),
                            }}
                            style={{ transformOrigin: "left" }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="relative flex items-start">
                        {STEPS.map((step, index) => (
                            <StepItem
                                key={step.id}
                                step={step}
                                index={index}
                                isActive={step.id === currentStep}
                                isCompleted={completedSteps.includes(step.id)}
                                onClick={() => onStepChange(step.id)}
                                isLast={index === STEPS.length - 1}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Progress Stats */}
            <motion.div
                className="flex justify-center mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                        완료됨: {completedSteps.length}개
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full" />
                        진행 중: 1개
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-slate-300 rounded-full" />
                        대기 중: {Math.max(0, STEPS.length - completedSteps.length - 1)}개
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}