"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/hooks/useRouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatSSN } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import InfoCard from "@/components/payee-info/InfoCard";
import {
    formatPayeeInfoForRegister,
    createInitialFormData,
    buildRegisterBizSections,
    buildRegisterPayeeSections,
    buildSubmitFormData,
    normalizePayeeEditFormData,
} from "@/utils/formatPayeeInfoForRegister";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import ProgressBar from "@/components/payee-info/ProgressBar";
import { GuideContainer } from "@/components/payee-info/GuideContainer";
import Loading from "@/app/loading";

export default function PayeeInfoRegisterPage() {
    const { getSearchParam, updateSearchParams, navigate } = useRouter();
    const [formData, setFormData] = useState(createInitialFormData());
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const { isLoggedIn, isLoading } = useAuth();

    const currentTab = getSearchParam("tab") || "guide";

    const handleStartRegister = () => {
        handleTabChange("biz");
    };

    const checkAndFetchData = async () => {
        setIsPageLoading(true);

        try {
            // 1. 이미 등록된 수취인 정보가 있는지 확인
            const checkResponse = await fetch("/api/member/my_payee_info", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
                },
            });

            if (checkResponse.ok) {
                const checkData = await checkResponse.json();

                // 이미 데이터가 있다면 View 페이지로 리다이렉트
                if (checkData.payeeData) {
                    toast.info("이미 등록된 정보가 있어 상세 페이지로 이동합니다.");
                    navigate("/payee-info/view");
                    return;
                }
            }

            const response = await fetch("/api/member/basic", {
                method: "GET",
                headers: {
                    credentials: "include",
                },
            });

            if (!response.ok) {
                throw new Error("이메일 정보를 불러오는 데 실패했습니다.");
            }

            const data = await response.json();
            // 1) view model 생성 (InfoCard에서 사용하는 구조)
            const { formData: normalized } = formatPayeeInfoForRegister(data);

            setFormData(normalized);
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error(`정보 로드 오류: ${error.message}`);
            setFormData(null);
        } finally {
            setIsPageLoading(false);
        }
    };

    // 데이터를 불러오는 로직을 분리합니다.
    const bizSections = useMemo(() => {
        if (!formData) return [];
        return buildRegisterBizSections(formData);
    }, [formData]);
    const payeeSections = useMemo(() => {
        if (!formData) return [];
        return buildRegisterPayeeSections(formData);
    }, [formData]);

    // Handle tab change
    const handleTabChange = (tab) => {
        updateSearchParams({ tab });
    };

    const setFormDataNormalized = (updater) => {
        setFormData((prev) => {
            const next =
                typeof updater === "function" ? updater(prev) : updater;

            // 2. SSN 필드가 존재하고, 값이 변경되었다면 포맷팅 적용
            if (next?.personal_info?.ssn !== prev?.personal_info?.ssn) {
                next.personal_info.ssn = formatSSN(next.personal_info.ssn);
            }

            return normalizePayeeEditFormData(next, prev);
        });
    };

    const structureKey = useMemo(() => {
        if (!formData) return "";
        const b = formData.biz_type;
        return [
            b.biz_type,
            b.is_overseas ? "1" : "0",
            b.is_minor ? "1" : "0",
            b.is_foreigner ? "1" : "0",
        ].join("|");
    }, [formData]);

    useEffect(() => {
        if (!formData) return;
        setErrors({});
    }, [structureKey]);

    useEffect(() => {
        // 1. 로딩 중이면 아무것도 하지 않음 (깜빡임 방지)
        if (isLoading) return;
        // 2. 인증되지 않았다면 리디렉션
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            checkAndFetchData();
        }
    }, [isLoggedIn, isLoading, navigate]);

    // 로딩 중이거나 인증되지 않았다면 콘텐츠를 보여주지 않음
    if (isLoading || !isLoggedIn || isPageLoading) {
        return <Loading />;
    }
    // Handle tab change
    const validateForm = () => {
        const newErrors = {};

        // 예시: formData.biz_type, formData.personal_info, formData.account_info...
        const bizType = formData?.biz_type?.biz_type;
        const isOverseas = !!formData?.biz_type?.is_overseas;
        const isMinor = !!formData?.biz_type?.is_minor;
        const isForeigner = !!formData?.biz_type?.is_foreigner;

        // 공통(읽기전용 3개는 validate 제외 or 서버에서만 검증)
        // personal_info: name/phone/email은 고정 출력 + 수정 불가라면, 프론트 validate에 굳이 넣지 않는 편이 낫습니다.

        // 개인
        if (bizType === "individual") {
            if (isForeigner) {
                if (!formData?.personal_info?.ssn)
                    newErrors.ssn = "외국인등록번호를 입력해 주세요.";
                // identification_type: foreigner_card 고정이면 체크 불필요
            } else {
                if (!formData?.personal_info?.ssn)
                    newErrors.ssn = "주민등록번호를 입력해 주세요.";
                if (!isMinor && !formData?.personal_info?.identification_type)
                    newErrors.identification_type =
                        "신분증 종류를 선택해 주세요.";
            }

            if (isMinor) {
                if (!formData?.personal_info?.guardian_name)
                    newErrors.guardian_name =
                        "법정대리인 이름을 입력해 주세요.";
                if (!formData?.personal_info?.guardian_tel)
                    newErrors.guardian_tel =
                        "법정대리인 연락처를 입력해 주세요.";
            }
        }

        // 개인사업자/법인
        if (bizType === "sole_proprietor" || bizType === "corporate_business") {
            if (!formData?.biz_info?.biz_name)
                newErrors.biz_name = "상호/법인명을 입력해 주세요.";
            if (!formData?.biz_info?.biz_reg_no)
                newErrors.biz_reg_no = "사업자/법인 등록번호를 입력해 주세요.";
        }

        // 계좌
        if (!formData?.account_info?.bank_name)
            newErrors.bank_name = "은행명을 입력해 주세요.";
        if (!formData?.account_info?.account_holder)
            newErrors.account_holder = "예금주를 입력해 주세요.";
        if (!formData?.account_info?.account_number)
            newErrors.account_number = "계좌번호를 입력해 주세요.";

        if (isOverseas) {
            if (!formData?.account_info?.swift_code)
                newErrors.swift_code = "SWIFT CODE를 입력해 주세요.";
            if (!formData?.account_info?.bank_address)
                newErrors.bank_address = "은행 주소를 입력해 주세요.";
        }

        // 세무
        if (!formData?.biz_type?.invoice_type)
            newErrors.invoice_type = "발행 유형을 선택해 주세요.";

        const hasFileOrUrl = (fileObj) => {
            return !!(fileObj?.file instanceof File) || !!fileObj?.url;
        };

        // ✅ 파일 필수 체크 (권장)
        if (bizType === "individual") {
            if (!isMinor) {
                if (!hasFileOrUrl(formData?.personal_info?.id_document)) {
                    newErrors.id_document = "신분증 파일을 업로드해 주세요.";
                }
            }

            if (isMinor) {
                if (
                    !hasFileOrUrl(
                        formData?.personal_info?.family_relation_certificate
                    )
                ) {
                    newErrors.family_relation_certificate =
                        "가족관계증명서를 업로드해 주세요.";
                }
            }
        }

        if (bizType === "sole_proprietor" || bizType === "corporate_business") {
            if (!hasFileOrUrl(formData?.biz_info?.business_document)) {
                newErrors.business_document = "사업자등록증을 업로드해 주세요.";
            }
        }

        // 통장사본(공통)
        if (!hasFileOrUrl(formData?.account_info?.bank_document)) {
            newErrors.bank_document = "통장사본을 업로드해 주세요.";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("필수 입력 항목을 모두 확인해주세요.");
            setIsSubmitting(false);
            return;
        }

        try {
            const submitFormData = buildSubmitFormData(formData); // ✅
            const response = await fetch("/api/member/payee_info_register", {
                method: "POST",
                body: submitFormData,
            });
            if (!response.ok) {
                const errorData = await response.json();
                toast.error(errorData.message);
                return;
            }

            navigate("/payee-info/done");
        } catch (err) {
            toast.error("네트워크 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-6 w-full">
                <div className="w-full flex flex-col gap-6 md:max-w-[816px] mx-auto">
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-12"
                    >
                        <h1>수취 정보 등록</h1>

                        <p className="mt-4 text-slate-500 max-w-lg mx-auto">
                            정산을 위해 필요한 기본 정보를 먼저 등록해 주세요.
                            <br />
                            입력하신 정보는 정산 외 다른 용도로는 사용되지 않습니다.
                        </p>
                    </motion.div>
                    <form onSubmit={handleSubmit}>
                        <Tabs
                            value={currentTab}
                            onValueChange={handleTabChange}
                            className="relative"
                        >
                            {/* Progress Tabs */}
                            <ProgressBar
                                currentStep={currentTab}
                                onStepChange={handleTabChange}
                            />
                            <TabsContent value="guide" className="space-y-6">
                                <GuideContainer
                                    handleStartRegister={handleStartRegister}
                                />
                            </TabsContent>

                            {/* Account Information Tab */}
                            <TabsContent value="biz" className="space-y-6">
                                {bizSections &&
                                    bizSections.map((section) => {
                                        return (
                                            <motion.div
                                                key={section.id}
                                                initial={{ y: 30, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ duration: 0.6 }}
                                                className="text-center mb-12"
                                            >
                                                <InfoCard
                                                    title={section.label}
                                                    mode="edit"
                                                    errors={errors}
                                                    setErrors={setErrors}
                                                    Info={section.value}
                                                    formData={formData}
                                                    setFormData={
                                                        setFormDataNormalized
                                                    }
                                                    isToggle={false} // 기본정보는 토글 숨김
                                                    isOpen={true} // ✅ 박스별 open
                                                ></InfoCard>
                                            </motion.div>
                                        );
                                    })}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between pt-6 w-full gap-8">
                                    <Button
                                        type="button"
                                        variant="line"
                                        onClick={() => handleTabChange("guide")}
                                        className="w-full"
                                    >
                                        이전
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => handleTabChange("payee")}
                                        className="w-full"
                                    >
                                        다음
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* Tax Information Tab */}
                            <TabsContent value="payee" className="space-y-6">
                                {payeeSections &&
                                    payeeSections.map((section) => {
                                        return (
                                            <motion.div
                                                key={section.id}
                                                initial={{ y: 30, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                transition={{ duration: 0.6 }}
                                                className="text-center mb-12"
                                            >
                                                <InfoCard
                                                    title={section.label}
                                                    mode="edit"
                                                    errors={errors}
                                                    setErrors={setErrors}
                                                    Info={section.value}
                                                    formData={formData}
                                                    setFormData={
                                                        setFormDataNormalized
                                                    }
                                                    isToggle={false} // 기본정보는 토글 숨김
                                                    isOpen={true} // ✅ 박스별 open
                                                ></InfoCard>
                                            </motion.div>
                                        );
                                    })}
                                {/* Navigation Buttons */}
                                <div className="flex justify-between pt-6 w-full gap-8">
                                    <Button
                                        disabled={isSubmitting}
                                        type="button"
                                        variant="line"
                                        onClick={() => handleTabChange("biz")}
                                        className="w-full"
                                    >
                                        이전
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full"
                                    >
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
                            </TabsContent>
                        </Tabs>
                    </form>
                </div>
            </div>
        </>
    );
}
