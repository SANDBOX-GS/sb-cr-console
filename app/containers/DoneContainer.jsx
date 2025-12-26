"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/common/Button";
import { useRouter } from "@/hooks/useRouter";
import { DoneProgress } from "@/components/icon/DoneProgress";
import { Box } from "@/components/common/Box";
export default function DoneContainer() {
    const { navigate } = useRouter();
    const StepItems = [
        {
            key: "submitted",
            title: "제출완료",
            desc: "수취 정보 제출 완료",
        },
        {
            key: "review",
            title: "검수",
            desc: "정산 담당자 검수 진행",
        },
        {
            key: "applied",
            title: "수취정보 반영",
            desc: "승인 시 정산금 지급일정 확정",
        },
    ];
    return (
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-12 max-w-[816px] w-full mx-auto gap-6">
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 mb-4"></div>

                <h1>수취 정보 등록</h1>

                <p className="text-lg text-slate-600 max-w-lg">
                    수취 정보 제출이 완료되었습니다.
                    <br />
                    담당자 검수 후 승인되면 정산 정보가 자동 반영됩니다.
                </p>
            </motion.div>
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full"
            >
                <Box className="w-full md:py-6 md:px-12 flex justify-center items-center">
                    <DoneProgress current="submitted" items={StepItems} />
                </Box>
            </motion.div>
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="w-full"
            >
                <Box className="w-full">
                    <ul className="px-4">
                        {[
                            "제출된 정보는 담당자 검수 후 승인됩니다.",
                            "정보가 정확하지 않은 경우 재등록 요청이 있을 수 있습니다.",
                            "검수 완료 후에도 사업자 종류, 계좌 정보 변경 시 재등록이 필요합니다.",
                        ].map((t) => {
                            return (
                                <li className="list-disc text-slate-500 text-base">
                                    {t}
                                </li>
                            );
                        })}
                    </ul>
                </Box>
                <Button
                    className="mt-8 w-full"
                    onClick={() => navigate("/payee-info/view")}
                >
                    내 정보 확인
                </Button>
            </motion.div>
        </div>
    );
}
