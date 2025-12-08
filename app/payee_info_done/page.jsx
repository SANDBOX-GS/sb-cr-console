"use client";
export const dynamic = "force-dynamic";

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, ArrowLeft, ExternalLink } from "lucide-react";
import { useRouter } from "@/hooks/useRouter";

export default function PayeeInfoDonePage() {
    const { navigate } = useRouter();

    return (
            <div className="flex-1 flex items-center justify-center px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center max-w-md"
                >
                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="relative mb-8"
                    >
                        <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"></div>
                        <CheckCircleIcon className="relative mx-auto h-24 w-24 text-green-500" />
                    </motion.div>

                    {/* Title */}
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-4xl font-bold text-slate-800 mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-700 bg-clip-text text-transparent"
                    >
                        수취인 정보 등록 완료!
                    </motion.h1>

                    {/* Description */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="mb-8"
                    >
                        <p className="text-lg text-slate-600 mb-4">
                            입력하신 정보가 성공적으로 등록되었습니다.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                            <h3 className="font-medium text-blue-800 mb-2">다음 단계 안내</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• 제출하신 서류를 1-2 영업일 내 검토합니다</li>
                                <li>• 검토 완료 후 이메일로 승인 알림을 보내드립니다</li>
                                <li>• 승인 완료 시 정산이 자동으로 시작됩니다</li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="space-y-3"
                    >
                        <Button
                            onClick={() => navigate('/payee_info_view')}
                            className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            대시보드로 이동
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => navigate('/payee-info')}
                            className="w-full border-slate-300 hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            정보 수정하기
                        </Button>
                    </motion.div>

                    {/* Additional Info */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.3 }}
                        className="mt-8 pt-6 border-t border-slate-200"
                    >
                        <p className="text-sm text-slate-500">
                            궁금한 사항이 있으시면 언제든지 고객지원팀에 문의해 주세요.
                        </p>
                        <div className="flex justify-center gap-4 mt-3">
                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                FAQ
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                고객지원
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                1:1 문의
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
    );
}