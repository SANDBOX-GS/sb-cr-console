import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner"; // <--- 이 줄이 필요합니다.

/**
 * @typedef {'valid' | 'expiring_soon' | 'expired'} ValidityStatus
 */

/**
 * @typedef {'30days' | 'once' | null} ConsentType
 */

/**
 * @typedef {object} InfoCallToActionProps
 * @property {ValidityStatus} validityStatus 정보의 유효 상태 ('valid', 'expiring_soon', 'expired')
 * @property {{ [key: string]: string }} errors 유효성 검사 오류 객체
 * @property {(type: ConsentType) => void} onConsent 동의 버튼 클릭 핸들러
 * @property {{ end?: string }} [validityPeriod={}] 유효기간 정보 (종료일)
 * @property {string} [lastModified=""] 마지막 수정일 (ISO string)
 * @property {boolean} [isEditMode=false] 수정 모드 여부
 * @property {() => void} [onEditMode=() => {}] 수정 모드 진입 핸들러
 * @property {() => void} [onCancelEdit=() => {}] 수정 취소 핸들러
 * @property {() => void} [onSave=() => {}] 저장 핸들러
 * @property {boolean} [isLoading=false] 로딩 상태 여부
 * @property {(metadata: object) => Promise<void>} onMetadataUpdate 메타데이터 갱신을 위한 콜백 (이름 변경)
 */

// Utility functions
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

/**
 * 정산 정보의 상태를 표시하고, 수정 및 동의 액션을 유도하는 CTA 섹션입니다.
 * @param {InfoCallToActionProps} props
 */
export function InfoCallToAction({
                                     validityStatus,
                                     errors,
                                     onConsent, // onConsent는 유효성 검사 담당 (page.jsx의 handleConsentWithValidation)
                                     onMetadataUpdate, // 🚨 이름 변경
                                     validityPeriod = {},
                                     lastModified = "",
                                     isEditMode = false,
                                     onEditMode = () => {},
                                     onCancelEdit = () => {},
                                     onSave = () => {},
                                 }) {
    const [isLoading, setIsLoading] = useState(false);

    /**
     * 동의 버튼 클릭 시 API를 호출하는 핸들러입니다.
     * @param {ConsentType} type '30days' 또는 'once'
     */
    const handleConsent = async (type) => {
        if (isLoading) return;

        // 필수 항목 오류가 있을 경우 API 호출을 막습니다.
        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsLoading(true);

        const payload = {
            consent_type: type,
        };

        // 💡 localStorage에서 토큰을 가져와 Authorization 헤더에 설정합니다.
        const userToken =
            typeof localStorage !== "undefined"
                ? localStorage.getItem("userToken")
                : "mock-token";

        try {
            // API 호출 URL: /api/member/payee_agree
            const response = await fetch("/api/member/payee_agree", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const newMetadata = result.metadata; // 🚨 서버가 동의 API 응답에 새로운 metadata를 포함한다고 가정

                // 🚨 성공 시 상위 컴포넌트의 metadata 갱신 함수 호출 (PayeeData는 건드리지 않음)
                if (onMetadataUpdate) {
                    // 서버 응답에서 새로운 메타데이터를 추출하여 상위 컴포넌트에 전달
                    await onMetadataUpdate(newMetadata);
                }
                toast.success("정보 수집에 성공적으로 동의했습니다.");
            } else {
                // API에서 에러 메시지를 반환하는 경우
                const errorMessage =
                    result.message ||
                    "정보 동의 처리에 실패했습니다. 다시 시도해 주세요.";
            }
        } catch (error) {
            console.error("동의 API 호출 중 오류 발생:", error);

            toast.error(
                "서버 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-4xl mb-8"
        >
            <div
                className={`${
                    validityStatus === "expired"
                        ? "bg-red-50 border-red-200"
                        : validityStatus === "expiring_soon"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-sky-50 border-sky-200"
                } border-2 rounded-2xl p-8 shadow-lg space-y-6`}
            >
                {/* 메인 콘텐츠 영역 */}
                <div className="text-center space-y-6">
                    {/* 제목 */}
                    <h2 className="text-2xl font-bold text-slate-800">
                        정산 받으실 정보를 확인해 주세요.
                    </h2>

                    {/* 설명 목록 */}
                    <div className="flex justify-center">
                        <ul className="text-slate-600 space-y-2 text-left inline-block">
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400 mt-2 text-xs">•</span>
                                <span>정보 수집·갱신에 동의하거나 정보를 수정해 주세요.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-slate-400 mt-2 text-xs">•</span>
                                <span>
                  동의하지 않으면, 정산금 지급 기일이 변동될 수 있습니다.
                </span>
                            </li>
                        </ul>
                    </div>

                    {/* 상태 라인 */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[rgba(255,255,255,1)] rounded-xl">
                        <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                정보 수집일 유효기간:
              </span>
                            <span className="text-sm font-medium text-slate-800">
                {validityPeriod.end
                    ? `${formatDate(validityPeriod.end)} 까지`
                    : "동의 필요"}
              </span>
                            <Badge
                                variant={
                                    validityStatus === "valid"
                                        ? "default"
                                        : validityStatus === "expiring_soon"
                                            ? "secondary"
                                            : "destructive"
                                }
                                className={
                                    validityStatus === "valid"
                                        ? "bg-green-100 text-green-800"
                                        : validityStatus === "expiring_soon"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-red-100 text-red-800"
                                }
                            >
                                {validityStatus === "valid"
                                    ? "유효"
                                    : validityStatus === "expiring_soon"
                                        ? "만료 임박"
                                        : "만료"}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">마지막 수정일:</span>
                            <span className="text-sm text-slate-800">
                {formatDateTime(lastModified)}
              </span>
                        </div>
                    </div>

                    {/* 오류 메시지 */}
                    {Object.keys(errors).length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-2xl mx-auto p-4 bg-red-100 border border-red-200 rounded-xl"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <AlertTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <span className="text-red-800 font-medium text-center">
                  동의하려면 필수 항목을 먼저 채워주세요.
                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* 버튼 영역 */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button
                            onClick={() => handleConsent("30days")}
                            className="bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white px-8 py-3 rounded-xl min-w-[160px] sm:w-auto"
                            disabled={isLoading || Object.keys(errors).length > 0} // 로딩 중이거나 오류가 있을 때 비활성화
                        >
                            <CalendarIcon className="w-5 h-5 mr-2" />
                            30일간 동의 유지하기
                        </Button>

                        <Button
                            onClick={() => handleConsent("once")}
                            variant="outline"
                            className="border-sky-300 text-sky-700 hover:bg-sky-50 px-8 py-3 rounded-xl min-w-[160px] sm:w-auto"
                            disabled={isLoading || Object.keys(errors).length > 0} // 로딩 중이거나 오류가 있을 때 비활성화
                        >
                            <ClockIcon className="w-5 h-5 mr-2" />
                            이번만 동의하기
                        </Button>
                    </div>

                    {/* 하단 안내 텍스트 */}
                    <p className="text-xs text-slate-500">
                        선택한 동의 옵션은 이후 변경 가능합니다.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}