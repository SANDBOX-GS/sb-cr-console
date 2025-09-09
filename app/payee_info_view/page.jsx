"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    UserIcon,
    EditIcon,
    SaveIcon,
    XIcon,
    CreditCardIcon,
    FileTextIcon,
    CheckCircleIcon,
    UploadIcon,
    Circle,
    CheckCircle,
    InfoIcon,
    DownloadIcon,
    FileIcon,
    EyeIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "@/hooks/useRouter";

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

export default function PayeeInfoViewPage() {
    const { navigate } = useRouter();

    // Mock data - 실제로는 API에서 가져올 데이터
    const [originalData] = useState({
        recipientInfo: {
            businessType: 'individual',
            isOverseas: false,
            isMinor: false,
            isForeigner: false,
            realName: '홍길동',
            idNumber: '123456-1234567',
            idDocumentType: 'resident_card',
            idDocument: new File([''], '주민등록증.jpg', { type: 'image/jpeg' }),
        },
        accountInfo: {
            bankName: 'KB국민은행',
            accountHolder: '홍길동',
            accountNumber: '123-456-789012',
            bankDocument: new File([''], '통장사본.pdf', { type: 'application/pdf' }),
        },
        taxInfo: {
            isSimpleTax: false,
            issueType: 'individual',
        },
    });

    const [formData, setFormData] = useState(originalData);
    const [isEditMode, setIsEditMode] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleEditMode = () => {
        setIsEditMode(true);
        setErrors({});
    };

    const handleCancelEdit = () => {
        setFormData(originalData);
        setIsEditMode(false);
        setErrors({});
    };

    const validateForm = () => {
        const newErrors = {};

        // Recipient Info Validation
        if (formData.recipientInfo.businessType === 'individual') {
            // 본인 정보는 항상 필요 (외국인/미성년자 상관없이)
            if (formData.recipientInfo.isForeigner) {
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

    const handleSave = async () => {
        setIsLoading(true);

        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Data saved:', formData);
            setIsEditMode(false);
            // TODO: Update originalData with the saved data
        }

        setIsLoading(false);
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

    const renderViewField = (label, value, required = false) => (
        <div className="space-y-2">
            <Label className="text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="min-h-[48px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                <span className="text-slate-800">{value || '-'}</span>
            </div>
        </div>
    );

    const renderEditField = (
        label,
        value,
        onChange,
        required = false,
        type = 'text',
        placeholder,
        error
    ) => (
        <div className="space-y-2">
            <Label htmlFor={label} className="text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={label}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`bg-white/50 ${error ? 'border-red-400' : ''}`}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );

    // File Preview Component
    const FilePreview = ({ file, label }) => {
        if (!file) return null;

        const isImage = file.type.startsWith('image/');

        return (
            <div className="space-y-2">
                <Label className="text-slate-600">{label}</Label>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isImage ? (
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <EyeIcon className="w-5 h-5 text-blue-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <FileIcon className="w-5 h-5 text-gray-600" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-slate-800">{file.name}</p>
                                <p className="text-sm text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                // 실제로는 파일 다운로드 로직
                                console.log('Download file:', file.name);
                            }}
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            다운로드
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // File Upload Component
    const FileUpload = ({
                            file,
                            onChange,
                            label,
                            accept,
                            required = false
                        }) => (
        <div className="space-y-2">
            <Label className="text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-colors">
                <UploadIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <input
                    type="file"
                    accept={accept}
                    onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        onChange(selectedFile);
                    }}
                    className="hidden"
                    id={`file-${label}`}
                />
                <label htmlFor={`file-${label}`} className="cursor-pointer">
                    <p className="text-sm text-slate-600 mb-1">
                        {file ? file.name : '파일을 선택하거나 여기에 끌어다 놓으세요'}
                    </p>
                    <p className="text-xs text-slate-500">PDF, JPG, PNG 파일 (최대 10MB)</p>
                </label>
                {file && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(undefined)}
                        className="mt-2"
                    >
                        파일 삭제
                    </Button>
                )}
            </div>
        </div>
    );

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
                        수취인 정보 관리
                    </h1>

                    <p className="text-lg text-slate-600 max-w-lg">
                        등록된 정산 정보를 확인하고 수정할 수 있습니다.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-4xl"
                >
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

                        <div className="relative">
                            {/* Header with Edit/Save buttons */}
                            <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">등록 정보</h2>
                                        <p className="text-sm text-slate-600">
                                            {isEditMode ? '수정 모드가 활성화되었습니다' : '현재 등록된 정보입니다'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    {!isEditMode ? (
                                        <Button
                                            onClick={handleEditMode}
                                            className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white"
                                        >
                                            <EditIcon className="w-4 h-4 mr-2" />
                                            정보 수정
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelEdit}
                                                disabled={isLoading}
                                            >
                                                <XIcon className="w-4 h-4 mr-2" />
                                                취소
                                            </Button>
                                            <Button
                                                onClick={handleSave}
                                                disabled={isLoading}
                                                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                                            >
                                                <SaveIcon className="w-4 h-4 mr-2" />
                                                {isLoading ? '저장 중...' : '저장'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* 수취인 정보 섹션 */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <UserIcon className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">수취인 정보</h3>
                                    </div>

                                    {/* 사업자 구분 */}
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">사업자 구분 *</Label>
                                        {!isEditMode ? (
                                            <div className="min-h-[48px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                        <span className="text-slate-800">
                          {formData.recipientInfo.businessType === 'individual' ? '개인' :
                              formData.recipientInfo.businessType === 'sole_proprietor' ? '개인사업자' : '법인사업자'}
                        </span>
                                            </div>
                                        ) : (
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
                                        )}
                                    </div>

                                    {/* 추가 옵션 for Individual */}
                                    {formData.recipientInfo.businessType === 'individual' && (
                                        <>
                                            {!isEditMode ? (
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600">추가 옵션</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.recipientInfo.isOverseas && (
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">해외 거주자</span>
                                                        )}
                                                        {formData.recipientInfo.isMinor && (
                                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">미성년자</span>
                                                        )}
                                                        {formData.recipientInfo.isForeigner && (
                                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">외국인</span>
                                                        )}
                                                        {!formData.recipientInfo.isOverseas && !formData.recipientInfo.isMinor && !formData.recipientInfo.isForeigner && (
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">해당사항 없음</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
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
                                        </>
                                    )}

                                    {/* 사업자 정보 (사업자/법인사업자인 경우) */}
                                    {(formData.recipientInfo.businessType === 'sole_proprietor' || formData.recipientInfo.businessType === 'corporate_business') && (
                                        <div className="space-y-6">
                                            <h4 className="font-medium text-slate-700">사업자 정보</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {!isEditMode ? (
                                                    <>
                                                        {renderViewField(
                                                            formData.recipientInfo.businessType === 'corporate_business' ? '법인명' : '상호명',
                                                            formData.recipientInfo.businessName || '',
                                                            true
                                                        )}
                                                        {renderViewField(
                                                            formData.recipientInfo.businessType === 'corporate_business' ? '법인등록번호' : '사업자등록번호',
                                                            formData.recipientInfo.businessNumber || '',
                                                            true
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {renderEditField(
                                                            formData.recipientInfo.businessType === 'corporate_business' ? '법인명' : '상호명',
                                                            formData.recipientInfo.businessName || '',
                                                            (value) => setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, businessName: value }
                                                            })),
                                                            true,
                                                            'text',
                                                            formData.recipientInfo.businessType === 'corporate_business' ? '법인명을 입력하세요' : '상호명을 입력하세요',
                                                            errors.businessName
                                                        )}
                                                        {renderEditField(
                                                            formData.recipientInfo.businessType === 'corporate_business' ? '법인등록번호' : '사업자등록번호',
                                                            formData.recipientInfo.businessNumber || '',
                                                            (value) => {
                                                                const formatted = formatBusinessNumber(value);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    recipientInfo: { ...prev.recipientInfo, businessNumber: formatted }
                                                                }));
                                                            },
                                                            true,
                                                            'text',
                                                            '000-00-00000',
                                                            errors.businessNumber
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* 사업자 관련 서류 */}
                                            {!isEditMode ? (
                                                <FilePreview
                                                    file={formData.recipientInfo.businessDocument}
                                                    label={formData.recipientInfo.businessType === 'corporate_business' ? '법인등록증' : '사업자등록증'}
                                                />
                                            ) : (
                                                <FileUpload
                                                    file={formData.recipientInfo.businessDocument}
                                                    onChange={(file) => setFormData(prev => ({
                                                        ...prev,
                                                        recipientInfo: { ...prev.recipientInfo, businessDocument: file }
                                                    }))}
                                                    label={formData.recipientInfo.businessType === 'corporate_business' ? '법인등록증' : '사업자등록증'}
                                                    accept="image/*,.pdf"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* 개인 정보 */}
                                    {formData.recipientInfo.businessType === 'individual' && (
                                        <div className="space-y-6">
                                            <h4 className="font-medium text-slate-700">
                                                {formData.recipientInfo.isForeigner ? '외국인 정보' : '본인 정보'}
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {!isEditMode ? (
                                                    <>
                                                        {formData.recipientInfo.isForeigner ? (
                                                            <>
                                                                {renderViewField('본명 (외국인)', formData.recipientInfo.foreignerName || '', true)}
                                                                {renderViewField('외국인등록번호', formData.recipientInfo.foreignerRegistrationNumber || '', true)}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {renderViewField('본명', formData.recipientInfo.realName || '', true)}
                                                                {renderViewField('주민등록번호', formData.recipientInfo.idNumber || '', true)}
                                                                {!formData.recipientInfo.isMinor && renderViewField('신분증 종류',
                                                                    ID_DOCUMENT_TYPES.find(type => type.value === formData.recipientInfo.idDocumentType)?.label || '',
                                                                    true
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {formData.recipientInfo.isForeigner ? (
                                                            <>
                                                                {renderEditField(
                                                                    '본명 (외국인)',
                                                                    formData.recipientInfo.foreignerName || '',
                                                                    (value) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, foreignerName: value }
                                                                    })),
                                                                    true,
                                                                    'text',
                                                                    '본명을 입력하세요',
                                                                    errors.foreignerName
                                                                )}
                                                                {renderEditField(
                                                                    '외국인등록번호',
                                                                    formData.recipientInfo.foreignerRegistrationNumber || '',
                                                                    (value) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, foreignerRegistrationNumber: value }
                                                                    })),
                                                                    true,
                                                                    'text',
                                                                    '외국인등록번호를 입력하세요',
                                                                    errors.foreignerRegistrationNumber
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {renderEditField(
                                                                    '본명',
                                                                    formData.recipientInfo.realName || '',
                                                                    (value) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, realName: value }
                                                                    })),
                                                                    true,
                                                                    'text',
                                                                    '본명을 입력하세요',
                                                                    errors.realName
                                                                )}
                                                                {renderEditField(
                                                                    '주민등록번호',
                                                                    formData.recipientInfo.idNumber || '',
                                                                    (value) => {
                                                                        const formatted = formatIdNumber(value);
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            recipientInfo: { ...prev.recipientInfo, idNumber: formatted }
                                                                        }));
                                                                    },
                                                                    true,
                                                                    'text',
                                                                    '123456-1234567',
                                                                    errors.idNumber
                                                                )}
                                                                {!formData.recipientInfo.isMinor && (
                                                                    <div className="space-y-2">
                                                                        <Label className="text-slate-600">신분증 종류 *</Label>
                                                                        <Select
                                                                            value={formData.recipientInfo.idDocumentType || ''}
                                                                            onValueChange={(value) => {
                                                                                setFormData(prev => ({
                                                                                    ...prev,
                                                                                    recipientInfo: { ...prev.recipientInfo, idDocumentType: value }
                                                                                }));
                                                                                if (errors.idDocumentType) setErrors(prev => ({ ...prev, idDocumentType: '' }));
                                                                            }}
                                                                        >
                                                                            <SelectTrigger className={`bg-white/50 ${errors.idDocumentType ? 'border-red-400' : ''}`}>
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
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* 신분증/외국인등록증 파일 */}
                                            {!isEditMode ? (
                                                <>
                                                    {formData.recipientInfo.isForeigner ? (
                                                        <FilePreview
                                                            file={formData.recipientInfo.foreignerRegistrationCard}
                                                            label="외국인등록증"
                                                        />
                                                    ) : (
                                                        <FilePreview
                                                            file={formData.recipientInfo.idDocument}
                                                            label="신분증"
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {formData.recipientInfo.isForeigner ? (
                                                        <FileUpload
                                                            file={formData.recipientInfo.foreignerRegistrationCard}
                                                            onChange={(file) => setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, foreignerRegistrationCard: file }
                                                            }))}
                                                            label="외국인등록증"
                                                            accept="image/*,.pdf"
                                                        />
                                                    ) : (
                                                        <FileUpload
                                                            file={formData.recipientInfo.idDocument}
                                                            onChange={(file) => setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, idDocument: file }
                                                            }))}
                                                            label="신분증"
                                                            accept="image/*,.pdf"
                                                        />
                                                    )}
                                                </>
                                            )}

                                            {/* 미성년자 법정대리인 정보 */}
                                            {formData.recipientInfo.isMinor && (
                                                <div className="space-y-6">
                                                    <h4 className="font-medium text-slate-700">법정대리인 정보</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {!isEditMode ? (
                                                            <>
                                                                {renderViewField('법정대리인 본명', formData.recipientInfo.guardianName || '', true)}
                                                                {renderViewField('법정대리인 연락처', formData.recipientInfo.guardianPhone || '', true)}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {renderEditField(
                                                                    '법정대리인 본명',
                                                                    formData.recipientInfo.guardianName || '',
                                                                    (value) => setFormData(prev => ({
                                                                        ...prev,
                                                                        recipientInfo: { ...prev.recipientInfo, guardianName: value }
                                                                    })),
                                                                    true,
                                                                    'text',
                                                                    '법정대리인 본명을 입력하세요',
                                                                    errors.guardianName
                                                                )}
                                                                {renderEditField(
                                                                    '법정대리인 연락처',
                                                                    formData.recipientInfo.guardianPhone || '',
                                                                    (value) => {
                                                                        const formatted = formatPhoneNumber(value);
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            recipientInfo: { ...prev.recipientInfo, guardianPhone: formatted }
                                                                        }));
                                                                    },
                                                                    true,
                                                                    'text',
                                                                    '010-0000-0000',
                                                                    errors.guardianPhone
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* 가족관계증명서 */}
                                                    {!isEditMode ? (
                                                        <FilePreview
                                                            file={formData.recipientInfo.familyRelationCertificate}
                                                            label="가족관계증명서"
                                                        />
                                                    ) : (
                                                        <FileUpload
                                                            file={formData.recipientInfo.familyRelationCertificate}
                                                            onChange={(file) => setFormData(prev => ({
                                                                ...prev,
                                                                recipientInfo: { ...prev.recipientInfo, familyRelationCertificate: file }
                                                            }))}
                                                            label="가족관계증명서"
                                                            accept="image/*,.pdf"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 계좌 정보 섹션 */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <CreditCardIcon className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">계좌 정보</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {!isEditMode ? (
                                            <>
                                                {renderViewField('은행명', formData.accountInfo.bankName, true)}
                                                {renderViewField('예금주', formData.accountInfo.accountHolder, true)}
                                                {renderViewField('계좌번호', formData.accountInfo.accountNumber, true)}
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-600">은행명 *</Label>
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
                                                        <SelectTrigger className={`bg-white/50 ${errors.bankName ? 'border-red-400' : ''}`}>
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
                                                {renderEditField(
                                                    '예금주',
                                                    formData.accountInfo.accountHolder,
                                                    (value) => setFormData(prev => ({
                                                        ...prev,
                                                        accountInfo: { ...prev.accountInfo, accountHolder: value }
                                                    })),
                                                    true,
                                                    'text',
                                                    '예금주를 입력하세요',
                                                    errors.accountHolder
                                                )}
                                                {renderEditField(
                                                    '계좌번호',
                                                    formData.accountInfo.accountNumber,
                                                    (value) => setFormData(prev => ({
                                                        ...prev,
                                                        accountInfo: { ...prev.accountInfo, accountNumber: value }
                                                    })),
                                                    true,
                                                    'text',
                                                    '계좌번호를 입력하세요',
                                                    errors.accountNumber
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* 해외 계좌 정보 (해외 거주자인 경우) */}
                                    {formData.recipientInfo.isOverseas && (
                                        <div className="space-y-6 p-4 bg-blue-50 rounded-xl">
                                            <h4 className="font-medium text-slate-700">해외 계좌 정보</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {!isEditMode ? (
                                                    <>
                                                        {renderViewField('SWIFT CODE', formData.accountInfo.swiftCode || '', true)}
                                                        {renderViewField('은행 주소', formData.accountInfo.bankAddress || '', true)}
                                                    </>
                                                ) : (
                                                    <>
                                                        {renderEditField(
                                                            'SWIFT CODE',
                                                            formData.accountInfo.swiftCode || '',
                                                            (value) => setFormData(prev => ({
                                                                ...prev,
                                                                accountInfo: { ...prev.accountInfo, swiftCode: value }
                                                            })),
                                                            true,
                                                            'text',
                                                            'SWIFT CODE를 입력하세요',
                                                            errors.swiftCode
                                                        )}
                                                        {renderEditField(
                                                            '은행 주소',
                                                            formData.accountInfo.bankAddress || '',
                                                            (value) => setFormData(prev => ({
                                                                ...prev,
                                                                accountInfo: { ...prev.accountInfo, bankAddress: value }
                                                            })),
                                                            true,
                                                            'text',
                                                            '은행 주소를 입력하세요',
                                                            errors.bankAddress
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 통장 사본 */}
                                    {!isEditMode ? (
                                        <FilePreview
                                            file={formData.accountInfo.bankDocument}
                                            label="통장 사본"
                                        />
                                    ) : (
                                        <FileUpload
                                            file={formData.accountInfo.bankDocument}
                                            onChange={(file) => setFormData(prev => ({
                                                ...prev,
                                                accountInfo: { ...prev.accountInfo, bankDocument: file }
                                            }))}
                                            label="통장 사본"
                                            accept="image/*,.pdf"
                                        />
                                    )}
                                </div>

                                {/* 세무 정보 섹션 */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <FileTextIcon className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800">세무 정보</h3>
                                    </div>

                                    {/* 간이과세자 여부 */}
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">간이과세자 여부</Label>
                                        {!isEditMode ? (
                                            <div className="min-h-[48px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                        <span className="text-slate-800">
                          {formData.taxInfo.isSimpleTax ? '간이과세자' : '일반과세자'}
                        </span>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3">
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
                                        )}
                                    </div>

                                    {/* 발행 유형 */}
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">발행 유형 *</Label>
                                        {!isEditMode ? (
                                            <div className="min-h-[48px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center">
                        <span className="text-slate-800">
                          {getSelectedIssueType()?.label} - {getSelectedIssueType()?.description}
                        </span>
                                            </div>
                                        ) : (
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
                                                    <div
                                                        key={type.value}
                                                        className="flex items-start space-x-4 p-4 border-2 rounded-xl transition-all duration-200"
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
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        )}
                                    </div>
                                </div>

                                {/* 등록 일시 정보 */}
                                <div className="pt-6 border-t border-slate-200">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <InfoIcon className="w-4 h-4" />
                                        <span>최초 등록: 2024년 12월 5일 14:30</span>
                                        <span className="mx-2">•</span>
                                        <span>최종 수정: 2024년 12월 5일 14:30</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
    );
}
