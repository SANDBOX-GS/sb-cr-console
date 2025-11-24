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
    const [createdAt, setCreatedAt] = useState(null);
    const [lastModified, setLastModified] = useState(null); // 🚨 lastModified도 API에서 받아오도록 수정
    const [validityStatus, setValidityStatus] = useState('expired'); // 🚨 API 값으로 대체될 상태

    // 아코디언 상태
    const [openSections, setOpenSections] = useState({});

    // 데이터를 불러오는 로직을 분리합니다.
    const fetchPayeeData = async () => {
        setIsPageLoading(true); // 데이터를 다시 불러올 때 로딩 상태를 설정
        try {
            const response = await fetch('/api/member/my_payee_info', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('userToken')}`,
                },
            });

            if (!response.ok) {
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

            setValidityStatus(data.metadata.validityStatus || 'expired');
            setValidityPeriod({
                end: data.metadata.validityPeriodEnd || null,
            });
            setCreatedAt(data.metadata.createdAt ? new Date(data.metadata.createdAt) : null);
            setLastModified(data.metadata.lastModified ? new Date(data.metadata.lastModified) : null);

        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error(`정보 로드 중 오류 발생: ${error.message}`);
            setOriginalData({});
            setFormData({});
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        fetchPayeeData(); // 최초 로딩 시 호출
    }, []);

    // 🚨 1. Metadata만 갱신하는 함수 정의
    const handleMetadataUpdate = async (newMetadata) => {
        if (!newMetadata) return;

        // isPageLoading을 잠시 true로 설정하는 대신, 로딩 상태는 InfoCallToAction에서 관리하므로
        // 여기서는 상태만 빠르게 업데이트합니다.

        setValidityStatus(newMetadata.validityStatus || 'expired');
        setValidityPeriod({
            end: newMetadata.validityPeriodEnd || null,
        });
        // lastModified도 업데이트 (서버 응답에는 updated_at이 포함되어야 함)
        setLastModified(newMetadata.lastModified ? new Date(newMetadata.lastModified) : new Date());

        // 이 함수는 PayeeData (originalData, formData)를 건드리지 않으므로,
        // 수정 중인 데이터가 보존됩니다.
    };

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

        const newErrors = validateRequiredFields(); // validateForm 대신 현재 validateRequiredFields 사용
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // ⭐ 1. 최종 DB 컬럼명에 매핑되는 객체 생성 (등록 페이지와 동일한 매핑 로직 사용)
            // 🚨🚨🚨 [수정된 부분 시작] 🚨🚨🚨
            // ⭐ 1. 최종 DB 컬럼명에 매핑되는 객체 생성 (let으로 선언)
            let finalData = {
                // [recipientInfo -> DB 컬럼 매핑] (기본 값 할당)
                biz_type: formData.recipientInfo.businessType,
                is_overseas: formData.recipientInfo.isOverseas ? 'Y' : 'N',
                is_minor: formData.recipientInfo.isMinor ? 'Y' : 'N',
                is_foreigner: formData.recipientInfo.isForeigner ? 'Y' : 'N',

                // 이름 및 번호는 초기값 null로 설정
                user_name: null,
                ssn: null,

                // 사업자/법인 정보
                biz_name: formData.recipientInfo.businessType === 'sole_proprietor' ? formData.recipientInfo.businessName : null,
                biz_reg_no: formData.recipientInfo.businessType === 'sole_proprietor' ? formData.recipientInfo.businessNumber : null,
                corp_name: formData.recipientInfo.businessType === 'corporate_business' ? formData.recipientInfo.businessName : null,
                corp_reg_no: formData.recipientInfo.businessType === 'corporate_business' ? formData.recipientInfo.businessNumber : null,

                // 법정대리인
                guardian_name: formData.recipientInfo.isMinor ? formData.recipientInfo.guardianName : null,
                guardian_tel: formData.recipientInfo.isMinor ? formData.recipientInfo.guardianPhone : null,

                // 신분증
                identification_type: formData.recipientInfo.isMinor || formData.recipientInfo.isForeigner ? null : formData.recipientInfo.idDocumentType,

                // [accountInfo -> DB 컬럼 매핑]
                bank_name: formData.accountInfo.bankName,
                account_holder: formData.accountInfo.accountHolder,
                account_number: formData.accountInfo.accountNumber,
                swift_code: formData.recipientInfo.isOverseas ? formData.accountInfo.swiftCode : null,
                bank_address: formData.recipientInfo.isOverseas ? formData.accountInfo.bankAddress : null,

                // [taxInfo -> DB 컬럼 매핑] (DB에 없는 필드는 백엔드에서 제거했으므로 여기서는 유효한 필드만 남김)
                invoice_type: formData.taxInfo.issueType,
                is_simple_taxpayer: formData.taxInfo.isSimpleTax ? 'Y' : 'N',
                // Tax Info의 DB에 없는 필드들은 서버 에러를 피하기 위해 finalData에서 제거해야 합니다.
                // (이전 답변에서 백엔드에서 제거했으나, 프론트에서 전송하지 않는 것이 더 안전)
                // 임시로 남겨두고 백엔드가 제거하는 방식 유지 (DB 마이그레이션을 대비)
                income_type: formData.taxInfo.incomeType || null,
                issue_tax_invoice: formData.taxInfo.issueTaxInvoice ? 'Y' : 'N',
                withholding: formData.taxInfo.withholding ? 'Y' : 'N',
                manager_name: formData.taxInfo.managerName || null,
                manager_tel: formData.taxInfo.managerPhone || null,
                manager_email: formData.taxInfo.managerEmail || null,
            };

            // 🚨 [핵심 수정]: 이름 및 등록번호 조건부 할당 (user_name, ssn)
            if (finalData.biz_type === 'individual') {
                if (finalData.is_foreigner === 'Y') {
                    // 외국인
                    finalData.user_name = formData.recipientInfo.foreignerName;
                    finalData.ssn = formData.recipientInfo.foreignerRegistrationNumber;
                } else {
                    // 내국인
                    finalData.user_name = formData.recipientInfo.realName;
                    finalData.ssn = formData.recipientInfo.idNumber;
                }
            }

            // ⭐ 2. 수동으로 FormData를 구성하여 파일/삭제 마커를 포함합니다.
            const submissionFormData = new FormData();

            // 일반 데이터 추가
            for (const key in finalData) {
                if (finalData[key] !== null && finalData[key] !== undefined) {
                    submissionFormData.append(key, finalData[key]);
                }
            }

            // 🚨🚨🚨 [핵심 수정]: 파일 수정, 추가, 삭제 마커 로직 🚨🚨🚨

            // 파일 필드와 해당 데이터가 위치한 섹션 매핑
            const fileFieldsMap = {
                business_document: 'recipientInfo',
                id_document: 'recipientInfo',
                bank_document: 'accountInfo',
                family_relation_certificate: 'recipientInfo',
                // FOREIGNER_REGISTRATION_CARD는 필드명 불일치 방지를 위해 프론트/백엔드 태그명을 통일해야 함
            };

            for (const tag in fileFieldsMap) {
                const section = fileFieldsMap[tag];
                // 폼 데이터 (현재 상태)
                const currentFileValue = formData[section][tag];
                // 원본 데이터 (수정 전 상태, FileInfo 객체였을 가능성 높음)
                const originalFileValue = originalData[section][tag];

                // 1. [새 파일 업로드/대체]: File 객체가 들어왔다면, 무조건 새 파일로 간주하고 FormData에 추가합니다.
                if (currentFileValue instanceof File) {
                    submissionFormData.append(tag, currentFileValue);
                }

                    // 2. [파일 삭제 요청]: 기존 파일 정보(originalFileValue)가 있었는데,
                    //    현재 값이 null/undefined이거나 빈 객체인 경우 삭제 요청 마커를 전송합니다.
                //    (기존 파일은 FileInfo {url, name} 객체였을 것이므로)
                else if (originalFileValue && !currentFileValue) {
                    submissionFormData.append(`delete_${tag}`, 'Y'); // 백엔드가 기대하는 삭제 마커
                }

                // 3. [기존 파일 유지]: FileInfo 객체(수정되지 않음)가 넘어왔다면,
                //    FormData에 추가하지 않습니다. (텍스트 데이터가 아니므로)
            }

            try {
                // 🚨 API 엔드포인트 사용 (등록/수정 엔드포인트가 동일하다고 가정)
                const response = await fetch('/api/member/payee_info_update', {
                    method: 'POST', // 등록/수정 API 메서드
                    body: submissionFormData,
                    // Content-Type: multipart/form-data 헤더는 자동으로 설정됩니다.
                });

                if (response.ok) {
                    const updatedData = await response.json();

                    // ⭐ 성공 시 상태 업데이트: originalData를 새로 저장된 데이터로 업데이트
                    // (서버가 응답으로 PayeeData 구조를 보내주면 좋으나, 여기서는 formData를 그대로 사용)
                    setOriginalData(formData);

                    setIsEditMode(false);
                    toast.success("수취인 정보가 성공적으로 저장되었습니다.");

                } else {
                    const errorData = await response.json();
                    console.error('수취인정보 수정 실패:', errorData);
                    alert(errorData.message);
                }
            } catch (error) {
                console.error('API 호출 중 오류 발생:', error);
                alert('네트워크 오류가 발생했습니다.');
            } finally {
                setIsLoading(false);
            }
        }
        else {
            alert('필수 입력 항목을 모두 확인해주세요.');
            console.log("Validation Errors:", newErrors);
            // 필요하다면 에러가 있는 탭으로 이동시키는 로직 추가
        }
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

    // 🚨 최초 등록일 포매팅 (null 체크 포함)
    const formattedCreateAt = useMemo(() => {
        return createdAt ? formatDateTime(createdAt) : '—';
    }, [createdAt]);

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
                    onMetadataUpdate={handleMetadataUpdate}
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
                        <span>최초 등록: {formattedCreateAt}</span>
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