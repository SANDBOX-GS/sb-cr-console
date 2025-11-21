"use client";

import {useState, useEffect, useMemo} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    EditIcon,
    SaveIcon,
    XIcon,
    Circle,
    InfoIcon,
} from "lucide-react";
import {motion} from "framer-motion";
import {useRouter} from "@/hooks/useRouter";
import {toast} from "sonner";
import {PageTitle} from "@/components/payee-info-view/PageTitle";
import {InfoCallToAction} from "@/components/payee-info-view/InfoCallToAction";
import {RecipientInfoSection} from "@/components/payee-info-view/RecipientInfoSection";
import {AccountInfoSection} from "@/components/payee-info-view/AccountInfoSection";
import {TaxInfoSection} from "@/components/payee-info-view/TaxInfoSection";
import {RecipientEditForm} from "@/components/payee-info-view/RecipientEditForm";
import {AccountEditForm} from "@/components/payee-info-view/AccountEditForm";
import {TaxEditForm} from "@/components/payee-info-view/TaxEditForm";
import {EditField} from "@/components/common/EditField";

// 🌟 새로운 파일 정보 타입 정의 🌟
/**
 * @typedef {object} FileInfo
 * @property {string} url 파일 다운로드 URL (S3 URL 등)
 * @property {string} name 파일의 실제 이름 (예: '주민등록증.jpg')
 */

import {
    formatPhoneNumber,
    maskAccountNumber,
    maskIdNumber,
    formatDate,
    formatDateTime,
} from "@/utils/formatters";
import {
    ID_DOCUMENT_TYPES,
    ISSUE_TYPES,
    KOREAN_BANKS,
    // ValidityStatus, ConsentType 타입은 JSDoc으로 대체합니다.
} from "@/constants/payee-data";

// 타입 정의를 JSDoc으로 대체합니다. (외부 파일에서 가져오지 않습니다)
/**
 * @typedef {('individual'|'sole_proprietor'|'corporate_business')} BusinessType
 */

/**
 * @typedef {object} RecipientInfo
 * @property {('individual'|'sole_proprietor'|'corporate_business')} businessType 사업자 구분
 * @property {boolean} isOverseas
 * @property {boolean} isMinor
 * @property {boolean} isForeigner
 * @property {string} [realName]
 * @property {string} [idNumber]
 * @property {('resident_card' | 'drivers_license' | 'passport' | 'resident_register')} [idDocumentType] 신분증 종류
 * @property {string} [foreignerName]
 * @property {string} [foreignerRegistrationNumber]
 * @property {string} [businessName]
 * @property {string} [businessNumber]
 * @property {string} [guardianName]
 * @property {string} [guardianPhone]
 * @property {File | FileInfo | null} [businessDocument] 사업자등록증 파일/정보 // 🌟 타입 변경
 * @property {File | FileInfo | null} [foreignerRegistrationCard] 외국인등록증 파일/정보 // 🌟 타입 변경
 * @property {File | FileInfo | null} [idDocument] 신분증 사본 파일/정보 // 🌟 타입 변경
 * @property {File | FileInfo | null} [familyRelationCertificate] 가족관계증명서 파일/정보 // 🌟 타입 변경
 */

/**
 * @typedef {object} AccountInfo
 * @property {string} bankName
 * @property {string} accountHolder
 * @property {string} accountNumber
 * @property {FileInfo | null} [bankDocument] // 🌟 File -> FileInfo | null
 * @property {string} [swiftCode]
 * @property {string} [bankAddress]
 */
/**
 * @typedef {object} TaxInfo
 * @property {boolean} isSimpleTax
 * @property {string} issueType
 * @property {string} [incomeType]
 * @property {boolean} [issueTaxInvoice]
 * @property {boolean} [withholding]
 * @property {string} [managerName]
 * @property {string} [managerPhone]
 * @property {string} [managerEmail]
 */

/**
 * @typedef {object} PayeeData
 * @property {RecipientInfo} recipientInfo
 * @property {AccountInfo} accountInfo
 * @property {TaxInfo} taxInfo
 */

/**
 * @typedef {object} FormErrors
 * @property {string} [realName]
 * @property {string} [idNumber]
 * @property {string} [businessName]
 * @property {string} [businessNumber]
 * @property {string} [bankName]
 * @property {string} [accountHolder]
 * @property {string} [accountNumber]
 * @property {string} [issueType]
 * @property {string} [incomeType]
 * @property {string} [issueTaxInvoice]
 * @property {string} [withholding]
 * @property {string} [managerName]
 * @property {string} [managerPhone]
 * @property {string} [managerEmail]
 * @property {string} [foreignerName]
 * @property {string} [foreignerRegistrationNumber]
 * @property {string} [guardianName]
 * @property {string} [guardianPhone]
 * // ... 기타 오류 필드
 */


export default function PayeeInfoViewPage() {
    const {navigate} = useRouter();

    const [originalData, setOriginalData] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [formData, setFormData] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [validityPeriod, setValidityPeriod] = useState({
        end: null,
    });
    const [lastModified, setLastModified] = useState(null); // 🚨 lastModified도 API에서 받아오도록 수정
    const [validityStatus, setValidityStatus] = useState('expired'); // 🚨 API 값으로 대체될 상태

    // 아코디언 상태
    const [openSections, setOpenSections] = useState({});

    useEffect(() => {
        const fetchPayeeData = async () => {
            try {
                // 현재 회원의 정보를 가져오는 API 호출
                const response = await fetch('/api/member/my_payee_info', {
                    method: 'GET',
                    headers: {
                        // 인증 토큰을 포함해야 서버가 현재 사용자를 식별할 수 있습니다.
                        'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                    },
                });

                if (!response.ok) {
                    // HTTP 오류 응답 처리
                    throw new Error('수취인 정보를 불러오는데 실패했습니다.');
                }
                const data = await response.json();
                const initialData = data.payeeData;

                if (initialData) {
                    setOriginalData(initialData);
                    setFormData(initialData);
                } else {
                    setOriginalData({});
                    setFormData({});
                }

                // 2) 메타데이터 설정
                setValidityStatus(data.metadata.validityStatus || 'expired');
                setValidityPeriod({
                    end: data.metadata.validityPeriodEnd || null,
                });
                setLastModified(data.metadata.lastModified ? new Date(data.metadata.lastModified) : null);

            } catch (error) {
                console.error("Fetch Error:", error);
                toast.error(`정보 로드 중 오류 발생: ${error.message}`);
            } finally {
                setIsPageLoading(false);
            }
        };

        fetchPayeeData();
    }, []);

    /**
     * @param {'30days' | 'once' | null} type
     */
    const handleConsent = async (type) => {
        if (isLoading) return;
        setIsLoading(true);

        // 💡 실제 API 호출: /api/member/payee_agree
        try {
            const response = await fetch('/api/member/payee_agree', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
                body: JSON.stringify({consent_type: type}),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // 성공 시 데이터 재로딩 (or 새로운 메타데이터로 상태 업데이트)
                toast.success("정보 수집에 성공적으로 동의했습니다.", {duration: 3000});
                // 🚨 성공 후 새로운 메타데이터로 상태를 직접 업데이트하거나,
                // 간단하게 전체 데이터를 다시 불러오도록 (fetchPayeeData) 호출할 수 있습니다.
                // 여기서는 페이지 새로고침 대신 간단히 상태만 업데이트했다고 가정하고,
                // InfoCallToAction에서 API 호출 후 데이터를 갱신하는 로직이 있다면 그를 따릅니다.
            } else {
                const errorMessage = result.message || "정보 동의 처리에 실패했습니다. 다시 시도해 주세요.";
                toast.error(errorMessage);
            }

        } catch (error) {
            console.error("동의 API 호출 중 오류 발생:", error);
            toast.error("서버 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    // 필수 항목 검증
    const validateRequiredFields = () => {
        /** @type {FormErrors} */
        const newErrors = {};

        // 기본 필수 항목 검증
        if (formData.recipientInfo.businessType === "individual") {
            if (formData.recipientInfo.isForeigner) {
                if (!formData.recipientInfo.foreignerName)
                    newErrors.foreignerName = "본명을 입력해 주세요.";
                if (!formData.recipientInfo.foreignerRegistrationNumber)
                    newErrors.foreignerRegistrationNumber =
                        "외국인등록번호를 입력해 주세요.";
            } else {
                if (!formData.recipientInfo.realName)
                    newErrors.realName = "본명을 입력해 주세요.";
                if (!formData.recipientInfo.idNumber)
                    newErrors.idNumber = "주민등록번호를 입력해 주세요.";
            }

            if (formData.recipientInfo.isMinor) {
                if (!formData.recipientInfo.guardianName)
                    newErrors.guardianName =
                        "법정대리인 본명을 입력해 주세요.";
                if (!formData.recipientInfo.guardianPhone)
                    newErrors.guardianPhone =
                        "법정대리인 연락처를 입력해 주세요.";
            }
        } else {
            if (!formData.recipientInfo.businessName)
                newErrors.businessName = "사업자명을 입력해 주세요.";
            if (!formData.recipientInfo.businessNumber)
                newErrors.businessNumber =
                    "사업자번호를 입력해 주세요.";
        }

        if (!formData.accountInfo.bankName)
            newErrors.bankName = "은행명을 입력해 주세요.";
        if (!formData.accountInfo.accountHolder)
            newErrors.accountHolder = "예금주를 입력해 주세요.";
        if (!formData.accountInfo.accountNumber)
            newErrors.accountNumber = "계좌번호를 입력해 주세요.";
        if (!formData.taxInfo.issueType)
            newErrors.issueType = "발행 유형을 선택해 주세요.";

        // Tax information validation
        if (!formData.taxInfo.incomeType)
            newErrors.incomeType = "소득 종류를 선택해 주세요.";
        if (formData.taxInfo.issueTaxInvoice === undefined)
            newErrors.issueTaxInvoice =
                "세금 계산서 발급 여부를 선택해 주세요.";
        if (formData.taxInfo.withholding === undefined)
            newErrors.withholding = "원천징수 여부를 선택해 주세요.";
        if (formData.taxInfo.issueTaxInvoice) {
            if (!formData.taxInfo.managerName)
                newErrors.managerName = "담당자명을 입력해 주세요.";
            if (!formData.taxInfo.managerPhone)
                newErrors.managerPhone =
                    "담당자 연락처를 입력해 주세요.";
            if (!formData.taxInfo.managerEmail)
                newErrors.managerEmail =
                    "담당자 이메일을 입력해 주세요.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * @param {'30days' | 'once' | null} type
     */
    const handleConsentWithValidation = (type) => {
        if (!validateRequiredFields()) {
            // 토스트 메시지로 변경
            toast.error("동의하려면 필수 항목을 먼저 채워주세요.");
            // 수정 모드로 전환
            setIsEditMode(true);
            return;
        }

        handleConsent(type);
    };

    const handleEditMode = () => {
        setIsEditMode(true);
        setErrors({});
    };

    const handleCancelEdit = () => {
        setFormData(originalData);
        setIsEditMode(false);
        setErrors({});
    };

    const handleSave = async () => {
        setIsLoading(true);

        if (!validateRequiredFields()) {
            setIsLoading(false);
            return;
        }

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Data saved:", formData);
        setOriginalData(formData);
        setIsEditMode(false);
        setIsLoading(false);
        toast.success("수취인 정보가 성공적으로 저장되었습니다.");
    };

    /**
     * @param {string} label
     * @param {string} value
     * @param {(value: string) => void} onChange
     * @param {boolean} [required=false]
     * @param {string} [type='text']
     * @param {string} [placeholder]
     * @param {string} [error]
     * @returns {JSX.Element}
     */
    const renderEditField = (
        label,
        value,
        onChange,
        required = false,
        type = "text",
        placeholder,
        error,
    ) => (
        <div className="space-y-2">
            <Label htmlFor={label} className="text-slate-600">
                {label}{" "}
                {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={label}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`bg-white/50 ${error ? "border-red-400" : ""}`}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );

    // 🚨 마지막 수정일 포매팅 (null 체크 포함)
    const formattedLastModified = useMemo(() => {
        return lastModified ? formatDateTime(lastModified) : '—';
    }, [lastModified]);

    // 로딩 상태 처리
    if (isPageLoading || originalData === null) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <motion.div
                    animate={{rotate: 360}}
                    transition={{duration: 1, repeat: Infinity, ease: "linear"}}
                >
                    <Circle className="text-indigo-500 w-8 h-8"/>
                </motion.div>
                <span className="ml-3 text-lg text-slate-700">정보를 불러오는 중...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col">


            <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 md:py-12">
                {/* 1. 페이지 타이틀 */}
                <PageTitle
                    title="수취인 정보 관리"
                    description="등록된 정산 정보를 확인하고 수정할 수 있습니다."
                />

                {/* 2. 상단 정보 박스 (행동 유도 영역) */}
                <InfoCallToAction
                    validityStatus={validityStatus}
                    errors={errors}
                    onConsent={handleConsentWithValidation}
                    validityPeriod={{
                        end: validityPeriod.end,
                    }}
                    lastModified={lastModified ? lastModified.toISOString() : ''}
                    isEditMode={isEditMode}
                    onEditMode={handleEditMode}
                    onCancelEdit={handleCancelEdit}
                    onSave={handleSave}
                    isLoading={isLoading}
                />

                {/* 4. 상세 정보 (아코디언) */}
                {!isEditMode ? (
                    <motion.div
                        initial={{y: 30, opacity: 0}}
                        animate={{y: 0, opacity: 1}}
                        transition={{duration: 0.6, delay: 0.3}}
                        className="w-full max-w-4xl space-y-4"
                    >
                        {/* 4-1. 수취인 정보 (본인정보 + 사업자정보 합침) */}
                        <RecipientInfoSection
                            isOpen={openSections.recipient}
                            onOpenChange={(open) =>
                                setOpenSections((prev) => ({
                                    ...prev,
                                    recipient: open,
                                }))
                            }
                            recipientInfo={formData.recipientInfo}
                            maskIdNumber={maskIdNumber}
                            renderEditField={renderEditField}
                            formatPhoneNumber={formatPhoneNumber}
                            setFormData={setFormData}
                            errors={errors}
                        />

                        {/* 4-2. 계좌 정보 */}
                        <AccountInfoSection
                            isOpen={openSections.account}
                            onOpenChange={(open) =>
                                setOpenSections((prev) => ({
                                    ...prev,
                                    account: open,
                                }))
                            }
                            accountInfo={formData.accountInfo}
                            isOverseas={formData.recipientInfo.isOverseas}
                            maskAccountNumber={maskAccountNumber}
                            renderEditField={renderEditField}
                            setFormData={setFormData}
                            errors={errors}
                        />

                        {/* 4-3. 세무 정보 */}
                        <TaxInfoSection
                            isOpen={openSections.tax}
                            onOpenChange={(open) =>
                                setOpenSections((prev) => ({
                                    ...prev,
                                    tax: open,
                                }))
                            }
                            taxInfo={formData.taxInfo}
                        />
                    </motion.div>
                ) : (
                    // 수정 모드 UI
                    <motion.div
                        initial={{y: 30, opacity: 0}}
                        animate={{y: 0, opacity: 1}}
                        transition={{duration: 0.6, delay: 0.3}}
                        className="w-full max-w-4xl space-y-6"
                    >
                        {/* 수취인 정보 편집 */}
                        <RecipientEditForm
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            renderEditField={renderEditField}
                        />

                        {/* 계좌 정보 편집 */}
                        <AccountEditForm
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            renderEditField={renderEditField}
                        />

                        {/* 세무 정보 편집 */}
                        <TaxEditForm
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            renderEditField={renderEditField}
                        />
                    </motion.div>
                )}

                {/* 5. 푸터 메타 */}
                <motion.div
                    initial={{y: 30, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{duration: 0.6, delay: 0.4}}
                    className="w-full max-w-4xl mt-8 pt-6 border-t border-slate-200"
                >
                    <div className="flex items-center gap-2 text-sm text-slate-500 justify-center">
                        <InfoIcon className="w-4 h-4"/>
                        <span>최초 등록: 2024.12.05 14:30</span>
                        <span className="mx-2">·</span>
                        <span>
                          최종 수정: {formattedLastModified}
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Mock Footer */}
            <div className="h-16 w-full border-t bg-white flex items-center justify-center text-xs text-slate-500">
                &copy; 2024 Payee System. All rights reserved.
            </div>

            {/* 플로팅 액션 버튼 */}
            <motion.div
                initial={{y: 100, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.4, delay: 0.5}}
                className="fixed bottom-[120px] left-1/2 -translate-x-1/2 z-50 flex gap-4"
            >
                {!isEditMode ? (
                    <Button
                        onClick={handleEditMode}
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-7 rounded-2xl shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105 text-lg w-[320px]"
                    >
                        <EditIcon className="w-6 h-6 mr-3"/>
                        정보 수정
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                            className="bg-white py-7 rounded-2xl shadow-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 text-lg w-[152px]"
                        >
                            <XIcon className="w-6 h-6 mr-2"/>
                            취소
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white py-7 rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 text-lg w-[152px]"
                        >
                            <SaveIcon className="w-6 h-6 mr-2"/>
                            {isLoading ? "저장 중..." : "저장"}
                        </Button>
                    </>
                )}
            </motion.div>
        </div>
    );
}