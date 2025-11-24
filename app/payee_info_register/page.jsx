"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
    UserIcon,
    InfoIcon,
    CreditCardIcon,
    FileTextIcon,
    CheckCircleIcon,
    ShieldCheckIcon,
    ClockIcon,
    UsersIcon,
    UploadIcon,
    ArrowRightIcon,
    Circle,
    CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "@/hooks/useRouter";
import ProgressTabs from "@/components/ProgressTabs";
import FileUpload from "@/components/ui/file-upload";
import { formatPhoneNumber, formatBusinessNumber, formatIdNumber } from "@/utils/formatters";
import { ID_DOCUMENT_TYPES, ISSUE_TYPES, KOREAN_BANKS } from "@/constants/payee-data";
import { useAuth } from '@/contexts/AuthContext';

const GUIDE_ITEMS = [
    {
        icon: CreditCardIcon,
        title: "계좌정보 등록",
        description: "정산을 위한 은행 계좌 정보를 안전하게 등록합니다.",
        features: [
            "국내 모든 은행 지원",
            "해외 계좌 등록 가능",
            "실시간 계좌 유효성 검증"
        ]
    },
    {
        icon: FileTextIcon,
        title: "세무정보 설정",
        description: "사업자 구분에 따른 세무 처리 방법을 설정합니다.",
        features: [
            "개인/사업자/법인 구분",
            "자동 세금 계산",
            "월별 세무 리포트 제공"
        ]
    },
    {
        icon: ShieldCheckIcon,
        title: "보안 및 개인정보",
        description: "모든 정보는 최고 수준의 보안으로 암호화됩니다.",
        features: [
            "AES-256 암호화",
            "개인정보보호법 준수",
            "정기 보안 감사"
        ]
    }
];

const PROCESS_STEPS = [
    {
        number: "01",
        title: "계좌정보",
        description: "은행 계좌 및 수취인 정보 입력"
    },
    {
        number: "02",
        title: "세무정보",
        description: "사업자 구분 및 세무 설정"
    },
    {
        number: "03",
        title: "등록완료",
        description: "정산 시스템 이용 준비 완료"
    }
];

export default function PayeeInfoPage() {
    const { getSearchParam, updateSearchParams, navigate } = useRouter();
    const { isLoggedIn, isLoading } = useAuth(); // AuthContext 사용

    const [formData, setFormData] = useState({
        recipientInfo: {
            biz_type: 'individual',             // 사업자 구분 (individual, sole_proprietor, corporate_business)
            is_overseas: false,                 // 해외 거주자
            is_minor: false,                    // 미성년자
            is_foreigner: false,                // 외국인

            // 개인 정보
            real_name: '',                      // 본명
            id_number: '',                      // 주민등록번호 (내국인)
            id_document_type: '',               // 신분증 종류 (내국인)
            foreigner_name: '',                 // 외국인 본명
            foreigner_registration_number: '',  // 외국인등록번호

            // 사업자/법인 정보
            business_name: '',                  // 상호명/법인명
            business_number: '',                // 사업자등록번호/법인등록번호

            // 법정대리인
            guardian_name: '',                  // 법정대리인 이름
            guardian_phone: '',                 // 법정대리인 연락처
        },
        accountInfo: {
            bank_name: '',
            account_holder: '',
            account_number: '',
            swift_code: '',
            bank_address: '',
        },
        taxInfo: {
            is_simple_taxpayer: false, // 간이과세자 여부
            invoice_type: 'tax_invoice',// 발행 유형 (tax_invoice, electronic_invoice, cash_receipt, individual)
        },
        files: {
            business_document: null,
            id_document: null,
            bank_document: null,
            family_relation_certificate: null
        }
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출 로딩 상태
    const [completedSteps, setCompletedSteps] = useState(['guide']);

    const currentTab = getSearchParam('tab') || 'guide';

    useEffect(() => {
        // 1. 로딩 중이면 아무것도 하지 않음 (깜빡임 방지)
        if (isLoading) return;

        // 2. 인증되지 않았다면 리디렉션
        if (!isLoggedIn) {
            navigate('/login');
        }

        // ... (나머지 탭 로직)
    }, [isLoggedIn, isLoading, navigate]);

    useEffect(() => {
        const newCompletedSteps = ['guide']; // Guide is always completed

        // Check account step - basic validation
        const hasBasicAccountInfo = formData.accountInfo.bank_name && formData.accountInfo.account_holder && formData.accountInfo.account_number;
        const hasOverseasInfo = !formData.recipientInfo.is_overseas || (formData.accountInfo.swift_code && formData.accountInfo.bank_address);

        if (hasBasicAccountInfo && hasOverseasInfo) {
            newCompletedSteps.push('account');
        }

        // Check tax step
        if (formData.taxInfo.invoice_type) {
            newCompletedSteps.push('tax');
        }

        setCompletedSteps(newCompletedSteps);
    }, [
        formData.accountInfo.bank_name,
        formData.accountInfo.account_holder,
        formData.accountInfo.account_number,
        formData.accountInfo.swift_code,
        formData.accountInfo.bank_address,
        formData.recipientInfo.is_overseas,
        formData.taxInfo.invoice_type
    ]);

    // 로딩 중이거나 인증되지 않았다면 콘텐츠를 보여주지 않음
    if (isLoading || !isLoggedIn) {
        return <div>인증 상태 확인 중...</div>;
    }

    // Handle tab change
    const handleTabChange = (tab) => {
        updateSearchParams({ tab });
    };

    const validateForm = () => {
        const newErrors = {};

        // Recipient Info Validation
        if (formData.recipientInfo.biz_type === 'individual') {
            // 본인 정보는 항상 필요 (외국인/미성년자 상관없이)
            if (formData.recipientInfo.is_foreigner) {
                // 외국인인 경우 외국인등록번호 사용
                if (!formData.recipientInfo.foreigner_name) newErrors.foreigner_name = '본명을 입력해 주세요.';
                if (!formData.recipientInfo.foreigner_registration_number) newErrors.foreigner_registration_number = '외국인등록번호를 입력해 주세요.';
            } else {
                // 내국인인 경우 주민등록번호 사용
                if (!formData.recipientInfo.real_name) newErrors.real_name = '본명을 입력해 주세요.';
                if (!formData.recipientInfo.id_number) newErrors.id_number = '주민등록번호를 입력해 주세요.';
                if (!formData.recipientInfo.is_minor && !formData.recipientInfo.id_document_type) {
                    newErrors.id_document_type = '신분증 종류를 선택해 주세요.';
                }
            }

            // 미성년자인 경우 법정대리인 정보 추가 필요
            if (formData.recipientInfo.is_minor) {
                if (!formData.recipientInfo.guardian_name) newErrors.guardian_name = '법정대리인 본명을 입력해 주세요.';
                if (!formData.recipientInfo.guardian_phone) newErrors.guardian_phone = '법정대리인 연락처를 입력해 주세요.';
            }
        } else {
            if (!formData.recipientInfo.business_name) {
                if (formData.recipientInfo.biz_type === 'corporate_business') {
                    newErrors.business_name = '법인명을 입력해 주세요.';
                } else {
                    newErrors.business_name = '상호명을 입력해 주세요.';
                }
            }
            if (!formData.recipientInfo.business_number) {
                if (formData.recipientInfo.biz_type === 'corporate_business') {
                    newErrors.business_number = '법인등록번호를 입력해 주세요.';
                } else {
                    newErrors.business_number = '사업자등록번호를 입력해 주세요.';
                }
            }
        }

        // Account Info Validation
        if (!formData.accountInfo.bank_name) newErrors.bank_name = '은행명을 입력해 주세요.';
        if (!formData.accountInfo.account_holder) newErrors.account_holder = '예금주를 입력해 주세요.';
        if (!formData.accountInfo.account_number) newErrors.account_number = '계좌번호를 입력해 주세요.';

        if (formData.recipientInfo.is_overseas) {
            if (!formData.accountInfo.swift_code) newErrors.swift_code = 'SWIFT CODE를 입력해 주세요.';
            if (!formData.accountInfo.bank_address) newErrors.bank_address = '은행 주소를 입력해 주세요.';
        }

        // Tax Info Validation
        if (!formData.taxInfo.invoice_type) newErrors.invoice_type = '발행 유형을 선택해 주세요.';

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
                is_overseas: formData.recipientInfo.is_overseas ? 'Y' : 'N',
                is_minor: formData.recipientInfo.is_minor ? 'Y' : 'N',
                is_foreigner: formData.recipientInfo.is_foreigner ? 'Y' : 'N',

                // 이름 및 번호 (biz_type에 따라 다르게 매핑)
                user_name: formData.recipientInfo.biz_type === 'individual' ? formData.recipientInfo.real_name : null,
                ssn: formData.recipientInfo.biz_type === 'individual'
                    ? (formData.recipientInfo.is_foreigner ? formData.recipientInfo.foreigner_registration_number : formData.recipientInfo.id_number)
                    : null,

                // 사업자/법인 정보
                biz_name: formData.recipientInfo.biz_type === 'sole_proprietor' ? formData.recipientInfo.business_name : null,
                biz_reg_no: formData.recipientInfo.biz_type === 'sole_proprietor' ? formData.recipientInfo.business_number : null,
                corp_name: formData.recipientInfo.biz_type === 'corporate_business' ? formData.recipientInfo.business_name : null,
                corp_reg_no: formData.recipientInfo.biz_type === 'corporate_business' ? formData.recipientInfo.business_number : null,

                // 법정대리인
                guardian_name: formData.recipientInfo.is_minor ? formData.recipientInfo.guardian_name : null,
                guardian_tel: formData.recipientInfo.is_minor ? formData.recipientInfo.guardian_phone : null,

                // 신분증
                identification_type: formData.recipientInfo.is_minor || formData.recipientInfo.is_foreigner ? null : formData.recipientInfo.id_document_type,

                // [accountInfo -> DB 컬럼 매핑]
                bank_name: formData.accountInfo.bank_name,
                account_holder: formData.accountInfo.account_holder,
                account_number: formData.accountInfo.account_number,
                swift_code: formData.recipientInfo.is_overseas ? formData.accountInfo.swift_code : null,
                bank_address: formData.recipientInfo.is_overseas ? formData.accountInfo.bank_address : null,

                // [taxInfo -> DB 컬럼 매핑]
                invoice_type: formData.taxInfo.invoice_type,
                is_simple_taxpayer: formData.taxInfo.is_simple_taxpayer ? 'Y' : 'N',
            };

            // 🚩 3. DB 컬럼명에 매핑된 최종 데이터 객체 (finalData) 확인
            console.log('3. Final Mapped Data (finalData):', finalData);

            // ⭐ 2. 수동으로 FormData를 구성하여 파일도 포함합니다.
            const submissionFormData = new FormData();

            // 일반 데이터 추가
            for (const key in finalData) {
                if (finalData[key] !== null) {
                    submissionFormData.append(key, finalData[key]);
                }
            }

            // 파일 데이터 추가 (FileUpload 컴포넌트가 File 객체를 반환한다고 가정)
            if (formData.files.business_document) submissionFormData.append('business_document', formData.files.business_document);
            if (formData.files.id_document) submissionFormData.append('id_document', formData.files.id_document);
            if (formData.files.bank_document) submissionFormData.append('bank_document', formData.files.bank_document);
            if (formData.files.family_relation_certificate) submissionFormData.append('family_relation_certificate', formData.files.family_relation_certificate);

            try {
                const response = await fetch('/api/member/payee_info_register', {
                    method: 'POST',
                    body: submissionFormData,
                });

                if (response.ok) {
                    console.log('수취인정보 등록 성공!');
                    navigate('/payee_info_done');
                } else {
                    const errorData = await response.json();
                    console.error('수취인정보 등록 실패:', errorData);
                    alert(errorData.message);
                }
            } catch (error) {
                console.error('API 호출 중 오류 발생:', error);
                alert('네트워크 오류가 발생했습니다.');
            } finally {
                setIsSubmitting(false);
            }
        }
        else {
            alert('필수 입력 항목을 모두 확인해주세요.');
            console.log("Validation Errors:", newErrors);
            handleTabChange('account');
        }
    };

    const getSelectedIssueType = () => {
        return ISSUE_TYPES.find(type => type.value === formData.taxInfo.invoice_type);
    };

    const handleStartAccountInfo = () => {
        handleTabChange('account');
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-12">
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 mb-4">
                    <UserIcon className="h-8 w-8 text-indigo-600" />
                </div>

                <h1 className="text-4xl font-bold text-slate-800 mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-700 bg-clip-text text-transparent">
                    수취인 정보 등록
                </h1>

                <p className="text-lg text-slate-600 max-w-lg">
                    정산을 위한 필수 정보를 입력해 주세요.<br />
                    모든 정보는 안전하게 암호화되어 보관됩니다.
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
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

                        <Tabs value={currentTab} onValueChange={handleTabChange} className="relative">
                            {/* Progress Tabs */}
                            <ProgressTabs
                                currentStep={currentTab}
                                onStepChange={handleTabChange}
                                completedSteps={completedSteps}
                            />

                            {/* Guide Tab */}
                            <TabsContent value="guide" className="space-y-6">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-8"
                                >
                                    {/* Process Overview */}
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-slate-800 mb-4">
                                                간단한 2단계로 완료
                                            </h2>
                                            <p className="text-slate-600">
                                                빠르고 안전한 등록 프로세스로 정산 계정을 생성하세요
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {PROCESS_STEPS.slice(0, 2).map((step, index) => (
                                                <motion.div
                                                    key={step.number}
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: 0.2 + index * 0.1 }}
                                                    className="relative"
                                                >
                                                    <div className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 rounded-xl pointer-events-none"></div>

                                                        <div className="relative">
                                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-full font-bold mb-4">
                                                                {step.number}
                                                            </div>
                                                            <h3 className="font-bold text-slate-800 mb-2">
                                                                {step.title}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                {step.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Arrow between steps */}
                                                    {index < 1 && (
                                                        <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                                                            <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Feature Grid */}
                                    <div className="space-y-6">
                                        <div className="text-center">
                                            <h2 className="text-2xl font-bold text-slate-800 mb-4">
                                                안전하고 편리한 정산 시스템
                                            </h2>
                                            <p className="text-slate-600">
                                                크리에이터를 위해 특별히 설계된 정산 플랫폼의 주요 기능들
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {GUIDE_ITEMS.map((item, index) => (
                                                <motion.div
                                                    key={item.title}
                                                    initial={{ y: 20, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: 0.3 + index * 0.1 }}
                                                    className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 group"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 rounded-xl pointer-events-none"></div>

                                                    <div className="relative">
                                                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-xl mb-4 group-hover:scale-105 transition-transform">
                                                            <item.icon className="w-5 h-5" />
                                                        </div>

                                                        <h3 className="font-bold text-slate-800 mb-3">
                                                            {item.title}
                                                        </h3>

                                                        <p className="text-sm text-slate-600 mb-4">
                                                            {item.description}
                                                        </p>

                                                        <ul className="space-y-2">
                                                            {item.features.map((feature, featureIndex) => (
                                                                <li key={featureIndex} className="flex items-center gap-2 text-xs text-slate-600">
                                                                    <CheckCircleIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                                    {feature}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Statistics */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                                            <ClockIcon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                            <p className="text-sm text-blue-600">평균 3분 소요</p>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                                            <UsersIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                            <p className="text-sm text-green-600">월 10만+ 크리에이터 이용</p>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                                            <ShieldCheckIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                            <p className="text-sm text-purple-600">100% 보안 보장</p>
                                        </div>
                                    </div>

                                    {/* Call to Action */}
                                    <div className="flex justify-center pt-6">
                                        <Button
                                            type="button"
                                            onClick={handleStartAccountInfo}
                                            className="w-full max-w-md h-12 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                                        >
                                            등록 시작하기
                                            <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </div>
                                </motion.div>
                            </TabsContent>

                            {/* Account Information Tab */}
                            <TabsContent value="account" className="space-y-6">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-6"
                                >
                                    {/* Business Type Selection - Chip UI */}
                                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                                        <Label>사업자 구분 *</Label>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                                { value: 'individual', label: '개인' },
                                                { value: 'sole_proprietor', label: '개인사업자' },
                                                { value: 'corporate_business', label: '법인사업자' }
                                            ].map((option) => (
                                                <motion.button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            recipientInfo: { ...prev.recipientInfo, biz_type: option.value }
                                                        }));
                                                    }}
                                                    className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                            ${formData.recipientInfo.biz_type === option.value
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800'
                                                    }
                          `}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Circle
                                                        className={`w-4 h-4 transition-all duration-200 ${
                                                            formData.recipientInfo.biz_type === option.value
                                                                ? 'fill-indigo-600 text-indigo-600'
                                                                : 'text-slate-400'
                                                        }`}
                                                    />
                                                    <span className="font-medium text-sm">{option.label}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Additional Options for Individual - Chip UI */}
                                    {formData.recipientInfo.biz_type === 'individual' && (
                                        <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
                                            <Label>추가 옵션</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {[
                                                    { key: 'is_overseas', label: '해외 거주자', checked: formData.recipientInfo.is_overseas },
                                                    { key: 'is_minor', label: '미성년자 (법정대리인 필요)', checked: formData.recipientInfo.is_minor },
                                                    { key: 'is_foreigner', label: '외국인', checked: formData.recipientInfo.is_foreigner }
                                                ].map((option) => (
                                                    <motion.button
                                                        key={option.key}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: {
                                                                    ...prev.recipientInfo,
                                                                    [option.key]: !prev.recipientInfo[option.key]
                                                                }
                                                            }));
                                                        }}
                                                        className={`
                              flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                              ${option.checked
                                                            ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-sm'
                                                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800'
                                                        }
                            `}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <CheckCircle
                                                            className={`w-4 h-4 transition-all duration-200 ${
                                                                option.checked
                                                                    ? 'text-blue-600'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        />
                                                        <span className="font-medium text-sm">{option.label}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Business Information (for business types) */}
                                    {(formData.recipientInfo.biz_type === 'sole_proprietor' || formData.recipientInfo.biz_type === 'corporate_business') && (
                                        <div className="space-y-6">
                                            <h3 className="font-medium text-slate-800">사업자 정보</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="business_name">
                                                        {formData.recipientInfo.biz_type === 'corporate_business' ? '법인명' : '상호명'} *
                                                    </Label>
                                                    <Input
                                                        id="business_name"
                                                        type="text"
                                                        placeholder={formData.recipientInfo.biz_type === 'corporate_business' ? '법인명을 입력하세요' : '상호명을 입력하세요'}
                                                        value={formData.recipientInfo.business_name || ''}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, business_name: e.target.value }
                                                            }));
                                                            if (errors.business_name) setErrors(prev => ({ ...prev, business_name: '' }));
                                                        }}
                                                        className={`h-12 bg-white/50 ${errors.business_name ? 'border-red-400' : ''}`}
                                                    />
                                                    {errors.business_name && <p className="text-red-500 text-sm">{errors.business_name}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="business_number">
                                                        {formData.recipientInfo.biz_type === 'corporate_business' ? '법인등록번호' : '사업자등록번호'} *
                                                    </Label>
                                                    <Input
                                                        id="business_number"
                                                        type="text"
                                                        placeholder="000-00-00000"
                                                        value={formData.recipientInfo.business_number || ''}
                                                        onChange={(e) => {
                                                            const formatted = formatBusinessNumber(e.target.value);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, business_number: formatted }
                                                            }));
                                                            if (errors.business_number) setErrors(prev => ({ ...prev, business_number: '' }));
                                                        }}
                                                        className={`h-12 bg-white/50 ${errors.business_number ? 'border-red-400' : ''}`}
                                                        maxLength={12}
                                                    />
                                                    {errors.business_number && <p className="text-red-500 text-sm">{errors.business_number}</p>}
                                                </div>
                                            </div>

                                            <FileUpload
                                                label={formData.recipientInfo.biz_type === 'corporate_business' ? '법인등록증' : '사업자등록증'}
                                                file={formData.files.business_document}
                                                onFileChange={(file) => setFormData(prev => ({ ...prev, files: { ...prev.files, business_document: file } }))}
                                                accept="image/*,.pdf"
                                            />
                                        </div>
                                    )}

                                    {/* Individual Information */}
                                    {formData.recipientInfo.biz_type === 'individual' && (
                                        <div className="space-y-6">
                                            <h3 className="font-medium text-slate-800">개인 정보</h3>

                                            {/* 본인 정보 - 외국인/내국인에 따라 다른 입력 필드 */}
                                            <div className="space-y-6">
                                                {formData.recipientInfo.is_foreigner ? (
                                                    // 외국인인 경우 외국인등록번호 입력
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="foreigner_name">본명 *</Label>
                                                            <Input
                                                                id="foreigner_name"
                                                                type="text"
                                                                placeholder="본명을 입력하세요"
                                                                value={formData.recipientInfo.foreigner_name || ''}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, foreigner_name: e.target.value }
                                                                    }));
                                                                    if (errors.foreigner_name) setErrors(prev => ({ ...prev, foreigner_name: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.foreigner_name ? 'border-red-400' : ''}`}
                                                            />
                                                            {errors.foreigner_name && <p className="text-red-500 text-sm">{errors.foreigner_name}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="foreigner_registration_number">외국인등록번호 *</Label>
                                                            <Input
                                                                id="foreigner_registration_number"
                                                                type="text"
                                                                placeholder="000000-0000000"
                                                                value={formData.recipientInfo.foreigner_registration_number || ''}
                                                                onChange={(e) => {
                                                                    const formatted = formatIdNumber(e.target.value);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, foreigner_registration_number: formatted }
                                                                    }));
                                                                    if (errors.foreigner_registration_number) setErrors(prev => ({ ...prev, foreigner_registration_number: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.foreigner_registration_number ? 'border-red-400' : ''}`}
                                                                maxLength={14}
                                                            />
                                                            {errors.foreigner_registration_number && <p className="text-red-500 text-sm">{errors.foreigner_registration_number}</p>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // 내국인인 경우 주민등록번호 입력
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="real_name">본명 *</Label>
                                                            <Input
                                                                id="real_name"
                                                                type="text"
                                                                placeholder="본명을 입력하세요"
                                                                value={formData.recipientInfo.real_name || ''}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, real_name: e.target.value }
                                                                    }));
                                                                    if (errors.real_name) setErrors(prev => ({ ...prev, real_name: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.real_name ? 'border-red-400' : ''}`}
                                                            />
                                                            {errors.real_name && <p className="text-red-500 text-sm">{errors.real_name}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="id_number">주민등록번호 *</Label>
                                                            <Input
                                                                id="id_number"
                                                                type="text"
                                                                placeholder="000000-0000000"
                                                                value={formData.recipientInfo.id_number || ''}
                                                                onChange={(e) => {
                                                                    const formatted = formatIdNumber(e.target.value);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, id_number: formatted }
                                                                    }));
                                                                    if (errors.id_number) setErrors(prev => ({ ...prev, id_number: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.id_number ? 'border-red-400' : ''}`}
                                                                maxLength={14}
                                                            />
                                                            {errors.id_number && <p className="text-red-500 text-sm">{errors.id_number}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 신분증 종류 선택 (미성년자가 아닌 내국인만) */}
                                                {!formData.recipientInfo.is_foreigner && !formData.recipientInfo.is_minor && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="id_document_type">신분증 종류 *</Label>
                                                        <Select
                                                            value={formData.recipientInfo.id_document_type}
                                                            onValueChange={(value) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    recipientInfo: { ...prev.recipientInfo, id_document_type: value }
                                                                }));
                                                                if (errors.id_document_type) setErrors(prev => ({ ...prev, id_document_type: '' }));
                                                            }}
                                                        >
                                                            <SelectTrigger className={`h-12 bg-white/50 ${errors.id_document_type ? 'border-red-400' : ''}`}>
                                                                <SelectValue placeholder="신분증 종류를 선택하세요" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {ID_DOCUMENT_TYPES.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.id_document_type && <p className="text-red-500 text-sm">{errors.id_document_type}</p>}
                                                    </div>
                                                )}

                                                {/* 신분증 업로드 */}
                                                {/* 미성년자가 아닌 경우에만 신분증 업로드 표시 */}
                                                {!formData.recipientInfo.is_minor && (
                                                    <FileUpload
                                                        label={formData.recipientInfo.is_foreigner ? '외국인등록증' : '신분증'}
                                                        file={formData.files.id_document}
                                                        onFileChange={(file) => setFormData(prev => ({ ...prev, files: { ...prev.files, id_document: file } }))}
                                                        accept="image/*,.pdf"
                                                    />
                                                )}
                                            </div>

                                            {/* 미성년자인 경우 법정대리인 정보 */}
                                            {formData.recipientInfo.is_minor && (
                                                <div className="space-y-6">
                                                    <h4 className="font-medium text-slate-800">법정대리인 정보</h4>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="guardian_name">법정대리인 본명 *</Label>
                                                            <Input
                                                                id="guardian_name"
                                                                type="text"
                                                                placeholder="법정대리인 본명을 입력하세요"
                                                                value={formData.recipientInfo.guardian_name || ''}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, guardian_name: e.target.value }
                                                                    }));
                                                                    if (errors.guardian_name) setErrors(prev => ({ ...prev, guardian_name: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.guardian_name ? 'border-red-400' : ''}`}
                                                            />
                                                            {errors.guardian_name && <p className="text-red-500 text-sm">{errors.guardian_name}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="guardian_phone">법정대리인 연락처 *</Label>
                                                            <Input
                                                                id="guardian_phone"
                                                                type="text"
                                                                placeholder="010-0000-0000"
                                                                value={formData.recipientInfo.guardian_phone || ''}
                                                                onChange={(e) => {
                                                                    const formatted = formatPhoneNumber(e.target.value);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, guardian_phone: formatted }
                                                                    }));
                                                                    if (errors.guardian_phone) setErrors(prev => ({ ...prev, guardian_phone: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.guardian_phone ? 'border-red-400' : ''}`}
                                                                maxLength={13}
                                                            />
                                                            {errors.guardian_phone && <p className="text-red-500 text-sm">{errors.guardian_phone}</p>}
                                                        </div>
                                                    </div>

                                                    <FileUpload
                                                        label="가족관계증명서"
                                                        file={formData.files.family_relation_certificate}
                                                        onFileChange={(file) => setFormData(prev => ({ ...prev, files: { ...prev.files, family_relation_certificate: file } }))}
                                                        accept="image/*,.pdf"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Account Information */}
                                    <div className="space-y-6">
                                        <h3 className="font-medium text-slate-800">계좌 정보</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="bank_name">은행명 *</Label>
                                                <Select
                                                    value={formData.accountInfo.bank_name}
                                                    onValueChange={(value) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            accountInfo: { ...prev.accountInfo, bank_name: value }
                                                        }));
                                                        if (errors.bank_name) setErrors(prev => ({ ...prev, bank_name: '' }));
                                                    }}
                                                >
                                                    <SelectTrigger className={`h-12 bg-white/50 ${errors.bank_name ? 'border-red-400' : ''}`}>
                                                        <SelectValue placeholder="은행을 선택하세요" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {KOREAN_BANKS.map((bank) => (
                                                            <SelectItem key={bank} value={bank}>
                                                                {bank}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.bank_name && <p className="text-red-500 text-sm">{errors.bank_name}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="account_holder">예금주 *</Label>
                                                <Input
                                                    id="account_holder"
                                                    type="text"
                                                    placeholder="예금주를 입력하세요"
                                                    value={formData.accountInfo.account_holder}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            accountInfo: { ...prev.accountInfo, account_holder: e.target.value }
                                                        }));
                                                        if (errors.account_holder) setErrors(prev => ({ ...prev, account_holder: '' }));
                                                    }}
                                                    className={`h-12 bg-white/50 ${errors.account_holder ? 'border-red-400' : ''}`}
                                                />
                                                {errors.account_holder && <p className="text-red-500 text-sm">{errors.account_holder}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="account_number">계좌번호 *</Label>
                                                <Input
                                                    id="account_number"
                                                    type="text"
                                                    placeholder="계좌번호를 입력하세요"
                                                    value={formData.accountInfo.account_number}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            accountInfo: { ...prev.accountInfo, account_number: e.target.value }
                                                        }));
                                                        if (errors.account_number) setErrors(prev => ({ ...prev, account_number: '' }));
                                                    }}
                                                    className={`h-12 bg-white/50 ${errors.account_number ? 'border-red-400' : ''}`}
                                                />
                                                {errors.account_number && <p className="text-red-500 text-sm">{errors.account_number}</p>}
                                            </div>
                                        </div>

                                        {/* 해외 거주자인 경우 추가 정보 */}
                                        {formData.recipientInfo.is_overseas && (
                                            <div className="space-y-6">
                                                <h4 className="font-medium text-slate-800">해외 계좌 추가 정보</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="swift_code">SWIFT CODE *</Label>
                                                        <Input
                                                            id="swift_code"
                                                            type="text"
                                                            placeholder="SWIFT CODE를 입력하세요"
                                                            value={formData.accountInfo.swift_code || ''}
                                                            onChange={(e) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    accountInfo: { ...prev.accountInfo, swift_code: e.target.value }
                                                                }));
                                                                if (errors.swift_code) setErrors(prev => ({ ...prev, swift_code: '' }));
                                                            }}
                                                            className={`h-12 bg-white/50 ${errors.swift_code ? 'border-red-400' : ''}`}
                                                        />
                                                        {errors.swift_code && <p className="text-red-500 text-sm">{errors.swift_code}</p>}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="bank_address">은행 주소 *</Label>
                                                        <Input
                                                            id="bank_address"
                                                            type="text"
                                                            placeholder="은행 주소를 입력하세요"
                                                            value={formData.accountInfo.bank_address || ''}
                                                            onChange={(e) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    accountInfo: { ...prev.accountInfo, bank_address: e.target.value }
                                                                }));
                                                                if (errors.bank_address) setErrors(prev => ({ ...prev, bank_address: '' }));
                                                            }}
                                                            className={`h-12 bg-white/50 ${errors.bank_address ? 'border-red-400' : ''}`}
                                                        />
                                                        {errors.bank_address && <p className="text-red-500 text-sm">{errors.bank_address}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 통장 사본 업로드 */}
                                        <div className="space-y-2">
                                            <FileUpload
                                                label="통장 사본"
                                                file={formData.files.bank_document}
                                                onFileChange={(file) => setFormData(prev => ({ ...prev, files: { ...prev.files, bank_document: file } }))}
                                                accept="image/*,.pdf"
                                            />
                                        </div>
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between pt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleTabChange('guide')}
                                            className="flex items-center gap-2"
                                        >
                                            이전
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleTabChange('tax')}
                                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
                                        >
                                            다음
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            </TabsContent>

                            {/* Tax Information Tab */}
                            <TabsContent value="tax" className="space-y-6">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-6"
                                >
                                    {/* Simple Tax Option - Chip UI */}
                                    <div className="space-y-4 p-4 bg-emerald-50 rounded-xl">
                                        <Label>세무 옵션</Label>
                                        <div className="flex flex-wrap gap-3">
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        taxInfo: { ...prev.taxInfo, is_simple_taxpayer: !prev.taxInfo.is_simple_taxpayer }
                                                    }));
                                                }}
                                                className={`
                          flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                          ${formData.taxInfo.is_simple_taxpayer
                                                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800'
                                                }
                        `}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <CheckCircle
                                                    className={`w-4 h-4 transition-all duration-200 ${
                                                        formData.taxInfo.is_simple_taxpayer
                                                            ? 'text-emerald-600'
                                                            : 'text-slate-400'
                                                    }`}
                                                />
                                                <span className="font-medium text-sm">간이과세자입니다</span>
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Issue Type Selection */}
                                    <div className="space-y-4">
                                        <Label>발행 유형 선택 *</Label>

                                        <RadioGroup
                                            value={formData.taxInfo.invoice_type}
                                            onValueChange={(value) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    taxInfo: { ...prev.taxInfo, invoice_type: value }
                                                }));
                                                if (errors.invoice_type) setErrors(prev => ({ ...prev, invoice_type: '' }));
                                            }}
                                            className="space-y-3"
                                        >
                                            {ISSUE_TYPES.map((type) => (
                                                <motion.div
                                                    key={type.value}
                                                    initial={{ y: 10, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    className="flex items-start space-x-4 p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md"
                                                    style={{
                                                        borderColor: formData.taxInfo.invoice_type === type.value ? '#6366f1' : '#e2e8f0',
                                                        backgroundColor: formData.taxInfo.invoice_type === type.value ? '#eef2ff' : 'white'
                                                    }}
                                                >
                                                    <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                                                    <div className="flex-1 space-y-2">
                                                        <Label htmlFor={type.value} className="font-medium text-slate-800 cursor-pointer">
                                                            {type.label}
                                                        </Label>
                                                        <p className="text-sm text-slate-600">{type.description}</p>
                                                        <p className="text-xs text-slate-500">{type.detail}</p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </RadioGroup>
                                        {errors.invoice_type && <p className="text-red-500 text-sm">{errors.invoice_type}</p>}
                                    </div>

                                    {/* Selected Issue Type Summary */}
                                    {getSelectedIssueType() && (
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="p-4 bg-indigo-50 rounded-xl border border-indigo-200"
                                        >
                                            <h4 className="font-medium text-indigo-800 mb-2">선택한 발행 유형</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-indigo-700">{getSelectedIssueType()?.label}</span>
                                                <span className="text-sm text-indigo-600">{getSelectedIssueType()?.description}</span>
                                            </div>
                                        </motion.div>
                                    )}

                                </motion.div>
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-6"
                                >

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between pt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleTabChange('account')}
                                            className="flex items-center gap-2"
                                        >
                                            이전
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    처리 중...
                                                </>
                                            ) : (
                                                <>
                                                    등록 완료
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}