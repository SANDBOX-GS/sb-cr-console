"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CreditCardIcon, FileTextIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "@/hooks/useRouter";
import ProgressBar from "@/components/payee-info/ProgressBar";
import { useAuth } from "@/contexts/AuthContext";
import { GuideContainer } from "@/components/payee-info/GuideContainer";
import { AccountContainer } from "@/components/payee-info/AccountContainer";
import { TaxContainer } from "@/components/payee-info/TaxContainer";

export default function PayeeInfoPage() {
    const { getSearchParam, updateSearchParams, navigate } = useRouter();
    // const { isLoggedIn, isLoading } = useAuth();

    const [formData, setFormData] = useState({
        recipientInfo: {
            biz_type: "individual", // 사업자 구분 (individual, sole_proprietor, corporate_business)
            is_overseas: false, // 해외 거주자
            is_minor: false, // 미성년자
            is_foreigner: false, // 외국인

            // 개인 정보
            real_name: "", // 본명
            id_number: "", // 주민등록번호 (내국인)
            id_document_type: "", // 신분증 종류 (내국인)
            foreigner_name: "", // 외국인 본명
            foreigner_registration_number: "", // 외국인등록번호

            // 사업자/법인 정보
            business_name: "", // 상호명/법인명
            business_number: "", // 사업자등록번호/법인등록번호

            // 법정대리인
            guardian_name: "", // 법정대리인 이름
            guardian_phone: "", // 법정대리인 연락처
        },
        accountInfo: {
            bank_name: "",
            account_holder: "",
            account_number: "",
            swift_code: "",
            bank_address: "",
        },
        taxInfo: {
            is_simple_taxpayer: false, // 간이과세자 여부
            invoice_type: "tax_invoice", // 발행 유형 (tax_invoice, electronic_invoice, cash_receipt, individual)
        },
        files: {
            business_document: null,
            id_document: null,
            bank_document: null,
            family_relation_certificate: null,
        },
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출 로딩 상태
    const [completedSteps, setCompletedSteps] = useState(["guide"]);

    const currentTab = getSearchParam("tab") || "guide";

    // useEffect(() => {
    //     // 1. 로딩 중이면 아무것도 하지 않음 (깜빡임 방지)
    //     if (isLoading) return;

    //     // 2. 인증되지 않았다면 리디렉션
    //     if (!isLoggedIn) {
    //         navigate('/login');
    //     }

    //     // ... (나머지 탭 로직)
    // }, [isLoggedIn, isLoading, navigate]);

    useEffect(() => {
        const newCompletedSteps = ["guide"]; // Guide is always completed

        // Check account step - basic validation
        const hasBasicAccountInfo =
            formData.accountInfo.bank_name &&
            formData.accountInfo.account_holder &&
            formData.accountInfo.account_number;
        const hasOverseasInfo =
            !formData.recipientInfo.is_overseas ||
            (formData.accountInfo.swift_code && formData.accountInfo.bank_address);

        if (hasBasicAccountInfo && hasOverseasInfo) {
            newCompletedSteps.push("account");
        }

        // Check tax step
        if (formData.taxInfo.invoice_type) {
            newCompletedSteps.push("tax");
        }

        setCompletedSteps(newCompletedSteps);
    }, [
        formData.accountInfo.bank_name,
        formData.accountInfo.account_holder,
        formData.accountInfo.account_number,
        formData.accountInfo.swift_code,
        formData.accountInfo.bank_address,
        formData.recipientInfo.is_overseas,
        formData.taxInfo.invoice_type,
    ]);

    // // 로딩 중이거나 인증되지 않았다면 콘텐츠를 보여주지 않음
    // if (isLoading || !isLoggedIn) {
    //     return <div>인증 상태 확인 중...</div>;
    // }

    // Handle tab change
    const handleTabChange = (tab) => {
        updateSearchParams({ tab });
    };

    const validateForm = () => {
        const newErrors = {};

        // Recipient Info Validation
        if (formData.recipientInfo.biz_type === "individual") {
            // 본인 정보는 항상 필요 (외국인/미성년자 상관없이)
            if (formData.recipientInfo.is_foreigner) {
                // 외국인인 경우 외국인등록번호 사용
                if (!formData.recipientInfo.foreigner_name)
                    newErrors.foreigner_name = "본명을 입력해 주세요.";
                if (!formData.recipientInfo.foreigner_registration_number)
                    newErrors.foreigner_registration_number =
                        "외국인등록번호를 입력해 주세요.";
            } else {
                // 내국인인 경우 주민등록번호 사용
                if (!formData.recipientInfo.real_name)
                    newErrors.real_name = "본명을 입력해 주세요.";
                if (!formData.recipientInfo.id_number)
                    newErrors.id_number = "주민등록번호를 입력해 주세요.";
                if (
                    !formData.recipientInfo.is_minor &&
                    !formData.recipientInfo.id_document_type
                ) {
                    newErrors.id_document_type = "신분증 종류를 선택해 주세요.";
                }
            }

            // 미성년자인 경우 법정대리인 정보 추가 필요
            if (formData.recipientInfo.is_minor) {
                if (!formData.recipientInfo.guardian_name)
                    newErrors.guardian_name = "법정대리인 본명을 입력해 주세요.";
                if (!formData.recipientInfo.guardian_phone)
                    newErrors.guardian_phone = "법정대리인 연락처를 입력해 주세요.";
            }
        } else {
            if (!formData.recipientInfo.business_name) {
                if (formData.recipientInfo.biz_type === "corporate_business") {
                    newErrors.business_name = "법인명을 입력해 주세요.";
                } else {
                    newErrors.business_name = "상호명을 입력해 주세요.";
                }
            }
            if (!formData.recipientInfo.business_number) {
                if (formData.recipientInfo.biz_type === "corporate_business") {
                    newErrors.business_number = "법인등록번호를 입력해 주세요.";
                } else {
                    newErrors.business_number = "사업자등록번호를 입력해 주세요.";
                }
            }
        }

        // Account Info Validation
        if (!formData.accountInfo.bank_name)
            newErrors.bank_name = "은행명을 입력해 주세요.";
        if (!formData.accountInfo.account_holder)
            newErrors.account_holder = "예금주를 입력해 주세요.";
        if (!formData.accountInfo.account_number)
            newErrors.account_number = "계좌번호를 입력해 주세요.";

        if (formData.recipientInfo.is_overseas) {
            if (!formData.accountInfo.swift_code)
                newErrors.swift_code = "SWIFT CODE를 입력해 주세요.";
            if (!formData.accountInfo.bank_address)
                newErrors.bank_address = "은행 주소를 입력해 주세요.";
        }

        // Tax Info Validation
        if (!formData.taxInfo.invoice_type)
            newErrors.invoice_type = "발행 유형을 선택해 주세요.";

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // ⭐ 1. 최종 DB 컬럼명에 매핑되는 객체 생성
            const finalData = {
                // member_idx는 백엔드에서 세션/인증 정보로 주입해야 합니다.
                // payout_ratio_id, active_status, ci_cd 등도 백엔드에서 처리합니다.

                // [recipientInfo -> DB 컬럼 매핑]
                biz_type: formData.recipientInfo.biz_type,
                is_overseas: formData.recipientInfo.is_overseas ? "Y" : "N",
                is_minor: formData.recipientInfo.is_minor ? "Y" : "N",
                is_foreigner: formData.recipientInfo.is_foreigner ? "Y" : "N",

                // 이름 및 번호 (biz_type에 따라 다르게 매핑)
                user_name:
                    formData.recipientInfo.biz_type === "individual"
                        ? formData.recipientInfo.real_name
                        : null,
                ssn:
                    formData.recipientInfo.biz_type === "individual"
                        ? formData.recipientInfo.is_foreigner
                            ? formData.recipientInfo.foreigner_registration_number
                            : formData.recipientInfo.id_number
                        : null,

                // 사업자/법인 정보
                biz_name:
                    formData.recipientInfo.biz_type === "sole_proprietor"
                        ? formData.recipientInfo.business_name
                        : null,
                biz_reg_no:
                    formData.recipientInfo.biz_type === "sole_proprietor"
                        ? formData.recipientInfo.business_number
                        : null,
                corp_name:
                    formData.recipientInfo.biz_type === "corporate_business"
                        ? formData.recipientInfo.business_name
                        : null,
                corp_reg_no:
                    formData.recipientInfo.biz_type === "corporate_business"
                        ? formData.recipientInfo.business_number
                        : null,

                // 법정대리인
                guardian_name: formData.recipientInfo.is_minor
                    ? formData.recipientInfo.guardian_name
                    : null,
                guardian_tel: formData.recipientInfo.is_minor
                    ? formData.recipientInfo.guardian_phone
                    : null,

                // 신분증
                identification_type:
                    formData.recipientInfo.is_minor || formData.recipientInfo.is_foreigner
                        ? null
                        : formData.recipientInfo.id_document_type,

                // [accountInfo -> DB 컬럼 매핑]
                bank_name: formData.accountInfo.bank_name,
                account_holder: formData.accountInfo.account_holder,
                account_number: formData.accountInfo.account_number,
                swift_code: formData.recipientInfo.is_overseas
                    ? formData.accountInfo.swift_code
                    : null,
                bank_address: formData.recipientInfo.is_overseas
                    ? formData.accountInfo.bank_address
                    : null,

                // [taxInfo -> DB 컬럼 매핑]
                invoice_type: formData.taxInfo.invoice_type,
                is_simple_taxpayer: formData.taxInfo.is_simple_taxpayer ? "Y" : "N",
            };

            // 🚩 3. DB 컬럼명에 매핑된 최종 데이터 객체 (finalData) 확인
            console.log("3. Final Mapped Data (finalData):", finalData);

            // ⭐ 2. 수동으로 FormData를 구성하여 파일도 포함합니다.
            const submissionFormData = new FormData();

            // 일반 데이터 추가
            for (const key in finalData) {
                if (finalData[key] !== null) {
                    submissionFormData.append(key, finalData[key]);
                }
            }

            // 파일 데이터 추가 (FileUpload 컴포넌트가 File 객체를 반환한다고 가정)
            if (formData.files.business_document)
                submissionFormData.append(
                    "business_document",
                    formData.files.business_document
                );
            if (formData.files.id_document)
                submissionFormData.append("id_document", formData.files.id_document);
            if (formData.files.bank_document)
                submissionFormData.append(
                    "bank_document",
                    formData.files.bank_document
                );
            if (formData.files.family_relation_certificate)
                submissionFormData.append(
                    "family_relation_certificate",
                    formData.files.family_relation_certificate
                );

            try {
                const response = await fetch("/api/member/payee_info_register", {
                    method: "POST",
                    body: submissionFormData,
                });

                if (response.ok) {
                    console.log("수취인정보 등록 성공!");
                    navigate("/payee_info_done");
                } else {
                    const errorData = await response.json();
                    console.error("수취인정보 등록 실패:", errorData);
                    alert(errorData.message);
                }
            } catch (error) {
                console.error("API 호출 중 오류 발생:", error);
                alert("네트워크 오류가 발생했습니다.");
            } finally {
                setIsSubmitting(false);
            }
        } else {
            alert("필수 입력 항목을 모두 확인해주세요.");
            console.log("Validation Errors:", newErrors);
            handleTabChange("account");
        }
    };

    const handleStartAccountInfo = () => {
        handleTabChange("account");
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-12">
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 mb-4"></div>

                <h1>수취 정보 등록</h1>

                <p className="text-lg text-slate-600 max-w-lg">
                    정산을 위해 필요한 기본 정보를 먼저 등록해 주세요.
                    <br />
                    입력하신 정보는 정산 지급 외 다른 용도로는 사용되지 않습니다.
                </p>
            </motion.div>

            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                // onSubmit={handleSubmit}
                className="w-full max-w-4xl"
            >
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
                            completedSteps={completedSteps}
                        />
                        <TabsContent value="guide" className="space-y-6">
                            <GuideContainer handleStartAccountInfo={handleStartAccountInfo} />
                        </TabsContent>

                        {/* Account Information Tab */}
                        <TabsContent value="account" className="space-y-6">
                            <AccountContainer
                                setFormData={setFormData}
                                formData={formData}
                                errors={errors}
                                handleTabChange={handleTabChange}
                            />
                        </TabsContent>

                        {/* Tax Information Tab */}
                        <TabsContent value="tax" className="space-y-6">
                            <TaxContainer
                                setFormData={setFormData}
                                formData={formData}
                                errors={errors}
                                handleTabChange={handleTabChange}
                                isSubmitting={isSubmitting}
                            />
                        </TabsContent>
                    </Tabs>
                </form>
            </motion.div>
        </div>
    );
}