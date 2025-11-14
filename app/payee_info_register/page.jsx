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
import FileUpload from "@/components/ui/file-upload"; // 새로 만든 FileUpload 컴포넌트 import

const ID_DOCUMENT_TYPES = [
    { value: 'resident_card', label: '주민등록증' },
    { value: 'drivers_license', label: '운전면허증' },
    { value: 'passport', label: '여권' },
    { value: 'resident_register', label: '주민등록등본' },
];

const ISSUE_TYPES = [
    {
        value: 'tax_invoice',
        label: '세금계산서',
        description: '공급가액+VAT(10%)',
        detail: '사업자등록이 있는 개인사업자 또는 법인사업자에 적용됩니다.'
    },
    {
        value: 'electronic_invoice',
        label: '전자계산서',
        description: '공급가액',
        detail: '사업자등록이 없는 프리랜서에게 적용됩니다.'
    },
    {
        value: 'cash_receipt',
        label: '현금영수증',
        description: '공급가액',
        detail: '개인이 소득공제를 받고자 할 때 발행됩니다.'
    },
    {
        value: 'individual',
        label: '개인',
        description: '공급가액-사업소득세(3.3%)',
        detail: '개인 사업소득으로 신고하는 경우에 적용됩니다.'
    },
];

const KOREAN_BANKS = [
    'KB국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행',
    'IBK기업은행', '대구은행', '부산은행', '경남은행', '광주은행',
    '전북은행', '제주은행', 'SC제일은행', '씨티은행', '새마을금고',
    '신협', '우체국', '카카오뱅크', '케이뱅크', '토스뱅크'
];

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

    const [formData, setFormData] = useState({
        recipientInfo: {
            biz_type: 'individual', // -> biz_type
            is_overseas: false,     // -> is_overseas
            is_minor: false,        // -> is_minor
            is_foreigner: false,    // -> is_foreigner

            // 개인: user_name, ssn / 사업자/법인: biz_name, biz_reg_no / 법인: corp_name, corp_reg_no
            // 임시 필드 이름은 기존대로 유지하되, DB에 들어갈 값만 별도로 처리
            realName: '',
            idNumber: '', // -> ssn (주민등록번호/외국인등록번호)
            idDocumentType: '', // -> identification_type

            // 법정대리인
            guardianName: '', // -> guardian_name
            guardianPhone: '', // -> guardian_tel
        },
        accountInfo: {
            bank_name: '',           // -> bank_name
            account_holder: '',      // -> account_holder
            account_number: '',      // -> account_number
            swift_code: '',          // -> swift_code
            bank_address: '',        // -> bank_address
        },
        taxInfo: {
            is_simple_taxpayer: false, // -> is_simple_taxpayer
            invoice_type: 'individual',// -> invoice_type
        },
        // 파일 및 임시 필드는 여기에 두어 finalData에서 정리
        files: {
            businessDocument: null,
            idDocument: null,
            bankDocument: null,
            familyRelationCertificate: null
        }
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [completedSteps, setCompletedSteps] = useState(['guide']);

    // Get current tab from URL parameter, default to 'guide'
    const currentTab = getSearchParam('tab') || 'guide';

    // Set default tab if not present
    useEffect(() => {
        if (!getSearchParam('tab')) {
            updateSearchParams({ tab: 'guide' });
        }
    }, []);

    // Handle tab change
    const handleTabChange = (tab) => {
        updateSearchParams({ tab });
    };

    // Auto-update completed steps
    useEffect(() => {
        const newCompletedSteps = ['guide']; // Guide is always completed

        // Check account step - basic validation
        const hasBasicAccountInfo = formData.accountInfo.bankName && formData.accountInfo.accountHolder && formData.accountInfo.accountNumber;
        const hasOverseasInfo = !formData.recipientInfo.isOverseas || (formData.accountInfo.swiftCode && formData.accountInfo.bankAddress);
        if (hasBasicAccountInfo && hasOverseasInfo) {
            newCompletedSteps.push('account');
        }

        // Check tax step
        if (formData.taxInfo.issueType) {
            newCompletedSteps.push('tax');
        }

        setCompletedSteps(newCompletedSteps);
    }, [
        formData.accountInfo.bankName,
        formData.accountInfo.accountHolder,
        formData.accountInfo.accountNumber,
        formData.accountInfo.swiftCode,
        formData.accountInfo.bankAddress,
        formData.recipientInfo.isOverseas,
        formData.taxInfo.issueType
    ]);

    const validateForm = () => {
        const newErrors = {};

        // Recipient Info Validation
        if (formData.recipientInfo.biz_type === 'individual') {
            // 본인 정보는 항상 필요 (외국인/미성년자 상관없이)
            if (formData.recipientInfo.is_foreigner) {
                // 외국인인 경우 외국인등록번호 사용
                if (!formData.recipientInfo.foreignerName) newErrors.foreignerName = '본명을 입력해 주세요.';
                if (!formData.recipientInfo.foreignerRegistrationNumber) newErrors.foreignerRegistrationNumber = '외국인등록번호를 입력해 주세요.';
            } else {
                // 내국인인 경우 주민등록번호 사용
                if (!formData.recipientInfo.realName) newErrors.realName = '본명을 입력해 주세요.';
                if (!formData.recipientInfo.idNumber) newErrors.idNumber = '주민등록번호를 입력해 주세요.';
                if (!formData.recipientInfo.isMinor && !formData.recipientInfo.idDocumentType) {
                    newErrors.idDocumentType = '신분증 종류를 선택해 주세요.';
                }
            }

            // 미성년자인 경우 법정대리인 정보 추가 필요
            if (formData.recipientInfo.isMinor) {
                if (!formData.recipientInfo.guardianName) newErrors.guardianName = '법정대리인 본명을 입력해 주세요.';
                if (!formData.recipientInfo.guardianPhone) newErrors.guardianPhone = '법정대리인 연락처를 입력해 주세요.';
            }
        } else {
            if (!formData.recipientInfo.businessName) {
                if (formData.recipientInfo.businessType === 'corporate_business') {
                    newErrors.businessName = '법인명을 입력해 주세요.';
                } else {
                    newErrors.businessName = '상호명을 입력해 주세요.';
                }
            }
            if (!formData.recipientInfo.businessNumber) {
                if (formData.recipientInfo.businessType === 'corporate_business') {
                    newErrors.businessNumber = '법인등록번호를 입력해 주세요.';
                } else {
                    newErrors.businessNumber = '사업자등록번호를 입력해 주세요.';
                }
            }
        }

        // Account Info Validation
        if (!formData.accountInfo.bankName) newErrors.bankName = '은행명을 입력해 주세요.';
        if (!formData.accountInfo.accountHolder) newErrors.accountHolder = '예금주를 입력해 주세요.';
        if (!formData.accountInfo.accountNumber) newErrors.accountNumber = '계좌번호를 입력해 주세요.';

        if (formData.recipientInfo.isOverseas) {
            if (!formData.accountInfo.swiftCode) newErrors.swiftCode = 'SWIFT CODE를 입력해 주세요.';
            if (!formData.accountInfo.bankAddress) newErrors.bankAddress = '은행 주소를 입력해 주세요.';
        }

        // Tax Info Validation
        if (!formData.taxInfo.issueType) newErrors.issueType = '발행 유형을 선택해 주세요.';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

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
                user_name: formData.recipientInfo.biz_type === 'individual' ? formData.recipientInfo.realName : null,
                ssn: formData.recipientInfo.biz_type === 'individual' ? (formData.recipientInfo.isForeigner ? formData.recipientInfo.foreignerRegistrationNumber : formData.recipientInfo.idNumber) : null,

                // 사업자/법인 정보
                biz_name: formData.recipientInfo.biz_type === 'sole_proprietor' ? formData.recipientInfo.businessName : null,
                biz_reg_no: formData.recipientInfo.biz_type === 'sole_proprietor' ? formData.recipientInfo.businessNumber : null,
                corp_name: formData.recipientInfo.biz_type === 'corporate_business' ? formData.recipientInfo.businessName : null,
                corp_reg_no: formData.recipientInfo.biz_type === 'corporate_business' ? formData.recipientInfo.businessNumber : null,

                // 계정 유형 (필요하다면)
                // user_type: formData.recipientInfo.biz_type === 'corporate_business' ? '법인' : '개인',

                // 법정대리인
                guardian_name: formData.recipientInfo.is_minor ? formData.recipientInfo.guardianName : null,
                guardian_tel: formData.recipientInfo.is_minor ? formData.recipientInfo.guardianPhone : null,

                // 신분증
                identification_type: formData.recipientInfo.is_minor || formData.recipientInfo.is_foreigner ? null : formData.recipientInfo.idDocumentType,

                // [accountInfo -> DB 컬럼 매핑]
                bank_name: formData.accountInfo.bank_name,
                account_holder: formData.accountInfo.account_holder,
                account_number: formData.accountInfo.account_number,
                swift_code: formData.recipientInfo.is_overseas ? formData.accountInfo.swift_code : null,
                bank_address: formData.recipientInfo.is_overseas ? formData.accountInfo.bank_address : null,

                // [taxInfo -> DB 컬럼 매핑]
                invoice_type: formData.taxInfo.invoice_type,
                is_simple_taxpayer: formData.taxInfo.is_simple_taxpayer ? 'Y' : 'N',

                // [파일 데이터] objectToFormData는 File 객체를 FormData에 직접 추가합니다.
                // 파일 데이터는 finalData 객체에 포함시키지 않고, FormData 변환 시 수동으로 추가하는 것이 좋습니다.
            };

            // 🚩 3. DB 컬럼명에 매핑된 최종 데이터 객체 (finalData) 확인
            console.log('3. Final Mapped Data (finalData):', finalData);
            return;

            // ⭐ 2. objectToFormData 대신, 수동으로 FormData를 구성하여 파일도 포함합니다.
            const submissionFormData = new FormData();

            // 일반 데이터 추가
            for (const key in finalData) {
                if (finalData[key] !== null) {
                    submissionFormData.append(key, finalData[key]);
                }
            }

            // 파일 데이터 추가 (FileUpload 컴포넌트가 File 객체를 반환한다고 가정)
            if (formData.files.businessDocument) submissionFormData.append('business_document', formData.files.businessDocument);
            if (formData.files.idDocument) submissionFormData.append('id_document', formData.files.idDocument);
            if (formData.files.bankDocument) submissionFormData.append('bank_document', formData.files.bankDocument);
            if (formData.files.familyRelationCertificate) submissionFormData.append('family_relation_certificate', formData.files.familyRelationCertificate);

            try {
                const response = await fetch('/api/member/payee_info_register', {
                    method: 'POST',
                    // headers: { 'Content-Type': 'application/json', },
                    body: submissionFormData,
                });

                if (response.ok) {
                    console.log('수취인정보 등록 성공!');
                    navigate('/payee-info/done');
                } else {
                    const errorData = await response.json();
                    console.error('수취인정보 등록 실패:', errorData);
                    alert(errorData.message); // 사용자에게 실패 메시지 표시
                }
            } catch (error) {
                console.error('API 호출 중 오류 발생:', error);
                alert('네트워크 오류가 발생했습니다.'); // 네트워크 오류 메시지 표시
            } finally {
                setIsLoading(false); // API 호출이 끝나면 항상 로딩 상태 비활성화
            }


            // // Simulate API call
            // await new Promise(resolve => setTimeout(resolve, 2000));
            // console.log('Payee info submitted:', formData);
            // // Navigate to success page
            // navigate('/payee-info/done');
        }
        else {
            alert('필수 입력 항목을 모두 확인해주세요.');
            console.log("Validation Errors:", newErrors);
            handleTabChange('account');
        }
    };

    const formatPhoneNumber = (value) => {
        const digits = value.replace(/\D/g, '');
        return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3').substring(0, 13);
    };

    const formatBusinessNumber = (value) => {
        const digits = value.replace(/\D/g, '');
        return digits.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3').substring(0, 12);
    };

    const formatIdNumber = (value) => {
        const digits = value.replace(/\D/g, '');
        return digits.replace(/(\d{6})(\d{7})/, '$1-$2').substring(0, 14);
    };

    const getSelectedIssueType = () => {
        return ISSUE_TYPES.find(type => type.value === formData.taxInfo.issueType);
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
                                                            recipientInfo: { ...prev.recipientInfo, businessType: option.value }
                                                        }));
                                                    }}
                                                    className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                            ${formData.recipientInfo.businessType === option.value
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800'
                                                    }
                          `}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <Circle
                                                        className={`w-4 h-4 transition-all duration-200 ${
                                                            formData.recipientInfo.businessType === option.value
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
                                    {formData.recipientInfo.businessType === 'individual' && (
                                        <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
                                            <Label>추가 옵션</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {[
                                                    { key: 'isOverseas', label: '해외 거주자', checked: formData.recipientInfo.isOverseas },
                                                    { key: 'isMinor', label: '미성년자 (법정대리인 필요)', checked: formData.recipientInfo.isMinor },
                                                    { key: 'isForeigner', label: '외국인', checked: formData.recipientInfo.isForeigner }
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
                                    {(formData.recipientInfo.businessType === 'sole_proprietor' || formData.recipientInfo.businessType === 'corporate_business') && (
                                        <div className="space-y-6">
                                            <h3 className="font-medium text-slate-800">사업자 정보</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="businessName">
                                                        {formData.recipientInfo.businessType === 'corporate_business' ? '법인명' : '상호명'} *
                                                    </Label>
                                                    <Input
                                                        id="businessName"
                                                        type="text"
                                                        placeholder={formData.recipientInfo.businessType === 'corporate_business' ? '법인명을 입력하세요' : '상호명을 입력하세요'}
                                                        value={formData.recipientInfo.businessName || ''}
                                                        onChange={(e) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, businessName: e.target.value }
                                                            }));
                                                            if (errors.businessName) setErrors(prev => ({ ...prev, businessName: '' }));
                                                        }}
                                                        className={`h-12 bg-white/50 ${errors.businessName ? 'border-red-400' : ''}`}
                                                    />
                                                    {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName}</p>}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="businessNumber">
                                                        {formData.recipientInfo.businessType === 'corporate_business' ? '법인등록번호' : '사업자등록번호'} *
                                                    </Label>
                                                    <Input
                                                        id="businessNumber"
                                                        type="text"
                                                        placeholder="000-00-00000"
                                                        value={formData.recipientInfo.businessNumber || ''}
                                                        onChange={(e) => {
                                                            const formatted = formatBusinessNumber(e.target.value);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, businessNumber: formatted }
                                                            }));
                                                            if (errors.businessNumber) setErrors(prev => ({ ...prev, businessNumber: '' }));
                                                        }}
                                                        className={`h-12 bg-white/50 ${errors.businessNumber ? 'border-red-400' : ''}`}
                                                        maxLength={12}
                                                    />
                                                    {errors.businessNumber && <p className="text-red-500 text-sm">{errors.businessNumber}</p>}
                                                </div>
                                            </div>

                                            <FileUpload
                                                label={formData.recipientInfo.businessType === 'corporate_business' ? '법인등록증' : '사업자등록증'}
                                                file={formData.recipientInfo.businessDocument}
                                                onFileChange={(file) => setFormData(prev => ({ ...prev, recipientInfo: { ...prev.recipientInfo, businessDocument: file } }))}
                                                accept="image/*,.pdf"
                                            />
                                        </div>
                                    )}

                                    {/* Individual Information */}
                                    {formData.recipientInfo.businessType === 'individual' && (
                                        <div className="space-y-6">
                                            <h3 className="font-medium text-slate-800">개인 정보</h3>

                                            {/* 본인 정보 - 외국인/내국인에 따라 다른 입력 필드 */}
                                            <div className="space-y-6">
                                                {formData.recipientInfo.isForeigner ? (
                                                    // 외국인인 경우 외국인등록번호 입력
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="foreignerName">본명 *</Label>
                                                            <Input
                                                                id="foreignerName"
                                                                type="text"
                                                                placeholder="본명을 입력하세요"
                                                                value={formData.recipientInfo.foreignerName || ''}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, foreignerName: e.target.value }
                                                                    }));
                                                                    if (errors.foreignerName) setErrors(prev => ({ ...prev, foreignerName: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.foreignerName ? 'border-red-400' : ''}`}
                                                            />
                                                            {errors.foreignerName && <p className="text-red-500 text-sm">{errors.foreignerName}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="foreignerRegistrationNumber">외국인등록번호 *</Label>
                                                            <Input
                                                                id="foreignerRegistrationNumber"
                                                                type="text"
                                                                placeholder="000000-0000000"
                                                                value={formData.recipientInfo.foreignerRegistrationNumber || ''}
                                                                onChange={(e) => {
                                                                    const formatted = formatIdNumber(e.target.value);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, foreignerRegistrationNumber: formatted }
                                                                    }));
                                                                    if (errors.foreignerRegistrationNumber) setErrors(prev => ({ ...prev, foreignerRegistrationNumber: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.foreignerRegistrationNumber ? 'border-red-400' : ''}`}
                                                                maxLength={14}
                                                            />
                                                            {errors.foreignerRegistrationNumber && <p className="text-red-500 text-sm">{errors.foreignerRegistrationNumber}</p>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // 내국인인 경우 주민등록번호 입력
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="realName">본명 *</Label>
                                                            <Input
                                                                id="realName"
                                                                type="text"
                                                                placeholder="본명을 입력하세요"
                                                                value={formData.recipientInfo.realName || ''}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, realName: e.target.value }
                                                                    }));
                                                                    if (errors.realName) setErrors(prev => ({ ...prev, realName: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.realName ? 'border-red-400' : ''}`}
                                                            />
                                                            {errors.realName && <p className="text-red-500 text-sm">{errors.realName}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="idNumber">주민등록번호 *</Label>
                                                            <Input
                                                                id="idNumber"
                                                                type="text"
                                                                placeholder="000000-0000000"
                                                                value={formData.recipientInfo.idNumber || ''}
                                                                onChange={(e) => {
                                                                    const formatted = formatIdNumber(e.target.value);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, idNumber: formatted }
                                                                    }));
                                                                    if (errors.idNumber) setErrors(prev => ({ ...prev, idNumber: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.idNumber ? 'border-red-400' : ''}`}
                                                                maxLength={14}
                                                            />
                                                            {errors.idNumber && <p className="text-red-500 text-sm">{errors.idNumber}</p>}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 신분증 종류 선택 (미성년자가 아닌 내국인만) */}
                                                {!formData.recipientInfo.isForeigner && !formData.recipientInfo.isMinor && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="idDocumentType">신분증 종류 *</Label>
                                                        <Select
                                                            value={formData.recipientInfo.idDocumentType}
                                                            onValueChange={(value) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    recipientInfo: { ...prev.recipientInfo, idDocumentType: value }
                                                                }));
                                                                if (errors.idDocumentType) setErrors(prev => ({ ...prev, idDocumentType: '' }));
                                                            }}
                                                        >
                                                            <SelectTrigger className={`h-12 bg-white/50 ${errors.idDocumentType ? 'border-red-400' : ''}`}>
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
                                                        {errors.idDocumentType && <p className="text-red-500 text-sm">{errors.idDocumentType}</p>}
                                                    </div>
                                                )}

                                                {/* 신분증 업로드 */}
                                                {/* 미성년자가 아닌 경우에만 신분증 업로드 표시 */}
                                                {!formData.recipientInfo.isMinor && (
                                                    <FileUpload
                                                        label={formData.recipientInfo.isForeigner ? '외국인등록증' : '신분증'}
                                                        file={formData.recipientInfo.idDocument}
                                                        onFileChange={(file) => setFormData(prev => ({ ...prev, recipientInfo: { ...prev.recipientInfo, idDocument: file } }))}
                                                        accept="image/*,.pdf"
                                                    />
                                                )}


                                            </div>

                                            {/* 미성년자인 경우 법정대리인 정보 */}
                                            {formData.recipientInfo.isMinor && (
                                                <div className="space-y-6">
                                                    <h4 className="font-medium text-slate-800">법정대리인 정보</h4>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="guardianName">법정대리인 본명 *</Label>
                                                            <Input
                                                                id="guardianName"
                                                                type="text"
                                                                placeholder="법정대리인 본명을 입력하세요"
                                                                value={formData.recipientInfo.guardianName || ''}
                                                                onChange={(e) => {
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, guardianName: e.target.value }
                                                                    }));
                                                                    if (errors.guardianName) setErrors(prev => ({ ...prev, guardianName: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.guardianName ? 'border-red-400' : ''}`}
                                                            />
                                                            {errors.guardianName && <p className="text-red-500 text-sm">{errors.guardianName}</p>}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor="guardianPhone">법정대리인 연락처 *</Label>
                                                            <Input
                                                                id="guardianPhone"
                                                                type="text"
                                                                placeholder="010-0000-0000"
                                                                value={formData.recipientInfo.guardianPhone || ''}
                                                                onChange={(e) => {
                                                                    const formatted = formatPhoneNumber(e.target.value);
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, guardianPhone: formatted }
                                                                    }));
                                                                    if (errors.guardianPhone) setErrors(prev => ({ ...prev, guardianPhone: '' }));
                                                                }}
                                                                className={`h-12 bg-white/50 ${errors.guardianPhone ? 'border-red-400' : ''}`}
                                                                maxLength={13}
                                                            />
                                                            {errors.guardianPhone && <p className="text-red-500 text-sm">{errors.guardianPhone}</p>}
                                                        </div>
                                                    </div>

                                                    <FileUpload
                                                        label="가족관계증명서"
                                                        file={formData.recipientInfo.familyRelationCertificate}
                                                        onFileChange={(file) => setFormData(prev => ({ ...prev, recipientInfo: { ...prev.recipientInfo, familyRelationCertificate: file } }))}
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
                                                <Label htmlFor="bankName">은행명 *</Label>
                                                <Select
                                                    value={formData.accountInfo.bankName}
                                                    onValueChange={(value) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            accountInfo: { ...prev.accountInfo, bankName: value }
                                                        }));
                                                        if (errors.bankName) setErrors(prev => ({ ...prev, bankName: '' }));
                                                    }}
                                                >
                                                    <SelectTrigger className={`h-12 bg-white/50 ${errors.bankName ? 'border-red-400' : ''}`}>
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
                                                {errors.bankName && <p className="text-red-500 text-sm">{errors.bankName}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="accountHolder">예금주 *</Label>
                                                <Input
                                                    id="accountHolder"
                                                    type="text"
                                                    placeholder="예금주를 입력하세요"
                                                    value={formData.accountInfo.accountHolder}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            accountInfo: { ...prev.accountInfo, accountHolder: e.target.value }
                                                        }));
                                                        if (errors.accountHolder) setErrors(prev => ({ ...prev, accountHolder: '' }));
                                                    }}
                                                    className={`h-12 bg-white/50 ${errors.accountHolder ? 'border-red-400' : ''}`}
                                                />
                                                {errors.accountHolder && <p className="text-red-500 text-sm">{errors.accountHolder}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="accountNumber">계좌번호 *</Label>
                                                <Input
                                                    id="accountNumber"
                                                    type="text"
                                                    placeholder="계좌번호를 입력하세요"
                                                    value={formData.accountInfo.accountNumber}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            accountInfo: { ...prev.accountInfo, accountNumber: e.target.value }
                                                        }));
                                                        if (errors.accountNumber) setErrors(prev => ({ ...prev, accountNumber: '' }));
                                                    }}
                                                    className={`h-12 bg-white/50 ${errors.accountNumber ? 'border-red-400' : ''}`}
                                                />
                                                {errors.accountNumber && <p className="text-red-500 text-sm">{errors.accountNumber}</p>}
                                            </div>
                                        </div>

                                        {/* 해외 거주자인 경우 추가 정보 */}
                                        {formData.recipientInfo.isOverseas && (
                                            <div className="space-y-6">
                                                <h4 className="font-medium text-slate-800">해외 계좌 추가 정보</h4>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="swiftCode">SWIFT CODE *</Label>
                                                        <Input
                                                            id="swiftCode"
                                                            type="text"
                                                            placeholder="SWIFT CODE를 입력하세요"
                                                            value={formData.accountInfo.swiftCode || ''}
                                                            onChange={(e) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    accountInfo: { ...prev.accountInfo, swiftCode: e.target.value }
                                                                }));
                                                                if (errors.swiftCode) setErrors(prev => ({ ...prev, swiftCode: '' }));
                                                            }}
                                                            className={`h-12 bg-white/50 ${errors.swiftCode ? 'border-red-400' : ''}`}
                                                        />
                                                        {errors.swiftCode && <p className="text-red-500 text-sm">{errors.swiftCode}</p>}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="bankAddress">은행 주소 *</Label>
                                                        <Input
                                                            id="bankAddress"
                                                            type="text"
                                                            placeholder="은행 주소를 입력하세요"
                                                            value={formData.accountInfo.bankAddress || ''}
                                                            onChange={(e) => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    accountInfo: { ...prev.accountInfo, bankAddress: e.target.value }
                                                                }));
                                                                if (errors.bankAddress) setErrors(prev => ({ ...prev, bankAddress: '' }));
                                                            }}
                                                            className={`h-12 bg-white/50 ${errors.bankAddress ? 'border-red-400' : ''}`}
                                                        />
                                                        {errors.bankAddress && <p className="text-red-500 text-sm">{errors.bankAddress}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 통장 사본 업로드 */}
                                        <div className="space-y-2">
                                            <FileUpload
                                                label="통장 사본"
                                                file={formData.accountInfo.bankDocument}
                                                onFileChange={(file) => setFormData(prev => ({ ...prev, accountInfo: { ...prev.accountInfo, bankDocument: file } }))}
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
                                                        taxInfo: { ...prev.taxInfo, isSimpleTax: !prev.taxInfo.isSimpleTax }
                                                    }));
                                                }}
                                                className={`
                          flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                          ${formData.taxInfo.isSimpleTax
                                                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700 shadow-sm'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800'
                                                }
                        `}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <CheckCircle
                                                    className={`w-4 h-4 transition-all duration-200 ${
                                                        formData.taxInfo.isSimpleTax
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
                                            value={formData.taxInfo.issueType}
                                            onValueChange={(value) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    taxInfo: { ...prev.taxInfo, issueType: value }
                                                }));
                                                if (errors.issueType) setErrors(prev => ({ ...prev, issueType: '' }));
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
                                                        borderColor: formData.taxInfo.issueType === type.value ? '#6366f1' : '#e2e8f0',
                                                        backgroundColor: formData.taxInfo.issueType === type.value ? '#eef2ff' : 'white'
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
                                        {errors.issueType && <p className="text-red-500 text-sm">{errors.issueType}</p>}
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
                                            disabled={isLoading}
                                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600"
                                        >
                                            {isLoading ? (
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