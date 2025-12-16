import { Box } from "../common/Box";
import { Button } from "../common/Button";
import { CheckCircleActive } from "../icon/CheckCircleActive";
import { CheckCircle } from "../icon/CheckCircle";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { ISSUE_TYPES } from "@/constants/payee-data";
export const TaxContainer = ({
                                 formData,
                                 setFormData,
                                 errors,
                                 isSubmitting,
                                 handleTabChange,
                             }) => {
    return (
        <>
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
            >
                {/* Simple Tax Option - Chip UI */}

                {/* Issue Type Selection */}

                <Box className="space-y-6">
                    <h4>발행 유형 선택 *</h4>
                    <div className="flex items-center justify-between gap-4 flex-col md:grid md:grid-cols-2">
                        {ISSUE_TYPES.map((option) => (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        taxInfo: {
                                            ...prev.taxInfo,
                                            invoice_type: option.value,
                                        },
                                    }));
                                }}
                                className={`
                            w-full border border-1 flex flex-col items-start gap-2 px-4 py-2.5 rounded-xl transition-all duration-200
                            ${
                                    formData.taxInfo.invoice_type === option.value
                                        ? "border-sky-300 bg-sky-100 text-slate-700 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800"
                                }
                          `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {formData.taxInfo.invoice_type === option.value ? (
                                        <div className="rounded-full bg-sky-400 w-4 h-4"></div>
                                    ) : (
                                        <div className="rounded-full border-2 border-slate-400 w-4 h-4"></div>
                                    )}
                                    <span className="font-medium text-sm">{option.label}</span>
                                </div>
                                <p className="text-sm text-sky-600">{option.description}</p>
                                <p className="text-xs text-slate-500">{option.detail}</p>
                            </motion.button>
                        ))}
                        {errors.invoice_type && (
                            <p className="text-red-500 text-sm">{errors.invoice_type}</p>
                        )}
                    </div>
                    <Box className="space-y-4 p-4 bg-slate-50 shadow-none">
                        <Label>세무 옵션</Label>
                        <div className="flex flex-wrap gap-3">
                            <motion.button
                                type="button"
                                onClick={() => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        taxInfo: {
                                            ...prev.taxInfo,
                                            is_simple_taxpayer: !prev.taxInfo.is_simple_taxpayer,
                                        },
                                    }));
                                }}
                                className={`
                          flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                          ${
                                    formData.taxInfo.is_simple_taxpayer
                                        ? "border-sky-300 bg-sky-100"
                                        : "border-slate-200 bg-white"
                                }
                        `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {formData.taxInfo.is_simple_taxpayer ? (
                                    <CheckCircleActive />
                                ) : (
                                    <CheckCircle />
                                )}
                                <span className="font-medium text-sm">간이과세자입니다</span>
                            </motion.button>
                        </div>
                    </Box>
                </Box>
            </motion.div>
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
            >
                {/* Simple Tax Option - Chip UI */}

                {/* Issue Type Selection */}

                <Box className="space-y-6">
                    <h4>수취정보 유효기간 *</h4>
                    <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
                        {[
                            { value: "30", label: "30일간 동일한 정보로 정산 받겠습니다." },
                            {
                                value: "1",
                                label: "정산 시마다 수취 정보를 재확인하겠습니다.",
                            },
                        ].map((option) => (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        taxInfo: {
                                            ...prev.taxInfo,
                                            expiry_date: option.value,
                                        },
                                    }));
                                }}
                                className={`
                            w-full border border-1 flex items-start justify-between gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
                            ${
                                    formData.taxInfo.expiry_date === option.value
                                        ? "border-sky-300 bg-sky-100 text-slate-700 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800"
                                }
                          `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {formData.taxInfo.expiry_date === option.value ? (
                                        <div className="rounded-full bg-sky-400 w-4 h-4"></div>
                                    ) : (
                                        <div className="rounded-full border-2 border-slate-400 w-4 h-4"></div>
                                    )}
                                    <span className="font-medium text-sm">{option.label}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </Box>
            </motion.div>
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
            >
                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 w-full gap-8">
                    <Button
                        type="button"
                        variant="line"
                        onClick={() => handleTabChange("account")}
                        className="w-full"
                    >
                        이전
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                처리 중...
                            </>
                        ) : (
                            "등록 요청"
                        )}
                    </Button>
                </div>
            </motion.div>
        </>
    );
};