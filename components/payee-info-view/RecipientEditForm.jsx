import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UserIcon } from "lucide-react";
import { FileUpload } from "./FileUpload";
import {
    formatPhoneNumber,
    formatBusinessNumber,
    formatIdNumber,
} from "@/utils/formatters";
import { ID_DOCUMENT_TYPES } from "@/constants/payee-data";

/**
 * @typedef {object} RecipientInfo
 * @property {('individual'|'sole_proprietor'|'corporate_business')} businessType 사업자 구분
 * @property {boolean} isOverseas 해외 거주자 여부
 * @property {boolean} isMinor 미성년자 여부
 * @property {boolean} isForeigner 외국인 여부
 * @property {string} [businessName] 사업자명
 * @property {string} [businessNumber] 사업자번호
 * @property {string} [realName] 본명 (내국인)
 * @property {string} [idNumber] 주민등록번호 (내국인)
 * @property {string} [foreignerName] 본명 (외국인)
 * @property {string} [foreignerRegistrationNumber] 외국인등록번호
 * @property {string} [guardianName] 법정대리인 본명
 * @property {string} [guardianPhone] 법정대리인 연락처
 * @property {('resident_card' | 'drivers_license' | 'passport' | 'resident_register')} [idDocumentType] 신분증 종류
 * @property {File} [businessDocument] 사업자등록증 파일
 * @property {File} [foreignerRegistrationCard] 외국인등록증 파일
 * @property {File} [idDocument] 신분증 사본 파일
 * @property {File} [familyRelationCertificate] 가족관계증명서 파일
 */

/**
 * @typedef {object} FormErrors
 * @property {string} [businessName] 사업자명 오류 메시지
 * @property {string} [businessNumber] 사업자번호 오류 메시지
 * @property {string} [realName] 본명 오류 메시지
 * @property {string} [idNumber] 주민등록번호 오류 메시지
 * // ... 기타 오류 필드
 */

/**
 * @typedef {object} RecipientEditFormProps
 * @property {{ recipientInfo: RecipientInfo }} formData 폼 데이터 객체
 * @property {(updater: (prev: any) => any) => void} setFormData 폼 데이터 업데이트 함수
 * @property {FormErrors} errors 유효성 검사 오류 객체
 * @property {(
 * label: string,
 * value: string,
 * onChange: (value: string) => void,
 * required?: boolean,
 * type?: string,
 * placeholder?: string,
 * error?: string,
 * ) => JSX.Element} renderEditField 사용자 정의 입력 필드 렌더링 함수
 */

/**
 * 수취인 정보를 수정하는 폼 컴포넌트입니다.
 * @param {RecipientEditFormProps} props
 */
export function RecipientEditForm({
                                      formData,
                                      setFormData,
                                      errors,
                                      renderEditField,
                                  }) {
    const updateFileState = (fieldName) => (fileOrInfo) => {
        setFormData((prev) => ({
            ...prev,
            recipientInfo: {
                ...prev.recipientInfo,
                [fieldName]: fileOrInfo,
            },
        }));
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-sky-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">수취인 정보 수정</h4>
            </div>

            {/* 사업자 구분 */}
            <div className="mb-6">
                <Label className="text-slate-600 mb-3 block">
                    사업자 구분 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                    value={formData.recipientInfo.businessType}
                    onValueChange={(value) =>
                        setFormData((prev) => ({
                            ...prev,
                            recipientInfo: {
                                ...prev.recipientInfo,
                                // TypeScript assertion (as any) 제거
                                businessType: value,
                            },
                        }))
                    }
                    className="flex flex-wrap gap-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="individual" id="individual" />
                        <Label htmlFor="individual" className="text-slate-700">
                            개인
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sole_proprietor" id="sole_proprietor" />
                        <Label htmlFor="sole_proprietor" className="text-slate-700">
                            개인사업자
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem
                            value="corporate_business"
                            id="corporate_business"
                        />
                        <Label htmlFor="corporate_business" className="text-slate-700">
                            법인사업자
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* 추가 옵션들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isOverseas"
                        checked={formData.recipientInfo.isOverseas}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                                ...prev,
                                recipientInfo: {
                                    ...prev.recipientInfo,
                                    isOverseas: !!checked,
                                },
                            }))
                        }
                    />
                    <Label htmlFor="isOverseas" className="text-slate-700">
                        해외거주자
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isMinor"
                        checked={formData.recipientInfo.isMinor}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                                ...prev,
                                recipientInfo: {
                                    ...prev.recipientInfo,
                                    isMinor: !!checked,
                                },
                            }))
                        }
                    />
                    <Label htmlFor="isMinor" className="text-slate-700">
                        미성년자
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="isForeigner"
                        checked={formData.recipientInfo.isForeigner}
                        onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                                ...prev,
                                recipientInfo: {
                                    ...prev.recipientInfo,
                                    isForeigner: !!checked,
                                },
                            }))
                        }
                    />
                    <Label htmlFor="isForeigner" className="text-slate-700">
                        외국인
                    </Label>
                </div>
            </div>

            {/* 개인 정보 입력 필드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.recipientInfo.businessType !== "individual" && (
                    <>
                        {renderEditField(
                            "사업자명",
                            formData.recipientInfo.businessName || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        businessName: value,
                                    },
                                })),
                            true,
                            "text",
                            "사업자명을 입력하세요",
                            errors.businessName
                        )}

                        {renderEditField(
                            "사업자번호",
                            formData.recipientInfo.businessNumber || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        businessNumber: formatBusinessNumber(value),
                                    },
                                })),
                            true,
                            "text",
                            "000-00-00000",
                            errors.businessNumber
                        )}
                    </>
                )}

                {formData.recipientInfo.isForeigner ? (
                    <>
                        {renderEditField(
                            "본명 (외국인)",
                            formData.recipientInfo.foreignerName || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        foreignerName: value,
                                    },
                                })),
                            true,
                            "text",
                            "본명을 입력하세요",
                            errors.foreignerName
                        )}

                        {renderEditField(
                            "외국인등록번호",
                            formData.recipientInfo.foreignerRegistrationNumber || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        foreignerRegistrationNumber: value,
                                    },
                                })),
                            true,
                            "text",
                            "000000-0000000",
                            errors.foreignerRegistrationNumber
                        )}
                    </>
                ) : (
                    <>
                        {renderEditField(
                            "본명",
                            formData.recipientInfo.realName || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        realName: value,
                                    },
                                })),
                            true,
                            "text",
                            "본명을 입력하세요",
                            errors.realName
                        )}

                        {renderEditField(
                            "주민등록번호",
                            formData.recipientInfo.idNumber || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        idNumber: formatIdNumber(value),
                                    },
                                })),
                            true,
                            "text",
                            "000000-0000000",
                            errors.idNumber
                        )}
                    </>
                )}

                {formData.recipientInfo.isMinor && (
                    <>
                        {renderEditField(
                            "법정대리인 본명",
                            formData.recipientInfo.guardianName || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        guardianName: value,
                                    },
                                })),
                            true,
                            "text",
                            "법정대리인 본명을 입력하세요",
                            errors.guardianName
                        )}

                        {renderEditField(
                            "법정대리인 연락처",
                            formData.recipientInfo.guardianPhone || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    recipientInfo: {
                                        ...prev.recipientInfo,
                                        guardianPhone: formatPhoneNumber(value),
                                    },
                                })),
                            true,
                            "tel",
                            "010-0000-0000",
                            errors.guardianPhone
                        )}
                    </>
                )}
            </div>

            {/* 신분증 종류 선택 */}
            {!formData.recipientInfo.isForeigner && (
                <div className="mt-6">
                    <Label className="text-slate-600 mb-3 block">
                        신분증 종류 <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.recipientInfo.idDocumentType}
                        onValueChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                recipientInfo: {
                                    ...prev.recipientInfo,
                                    // TypeScript assertion (as any) 제거
                                    idDocumentType: value,
                                },
                            }))
                        }
                    >
                        <SelectTrigger className="bg-white/50">
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
                </div>
            )}

            {/* 파일 업로드 */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. 사업자등록증 */}
                {formData.recipientInfo.businessType !== "individual" && (
                    <FileUpload
                        // file prop은 File 객체 또는 FileInfo 객체 모두 받을 수 있음
                        file={formData.recipientInfo.businessDocument}
                        // onChange 핸들러는 헬퍼 함수를 통해 상태를 업데이트
                        onChange={updateFileState("businessDocument")}
                        label="사업자등록증"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                    />
                )}

                {/* 2. 신분증 사본 / 외국인등록증 */}
                {formData.recipientInfo.isForeigner ? (
                    <FileUpload
                        file={formData.recipientInfo.foreignerRegistrationCard}
                        onChange={updateFileState("foreignerRegistrationCard")}
                        label="외국인등록증"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                    />
                ) : (
                    <FileUpload
                        file={formData.recipientInfo.idDocument}
                        onChange={updateFileState("idDocument")}
                        label="신분증 사본"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                    />
                )}

                {/* 3. 가족관계증명서 */}
                {formData.recipientInfo.isMinor && (
                    <FileUpload
                        file={formData.recipientInfo.familyRelationCertificate}
                        onChange={updateFileState("familyRelationCertificate")}
                        label="가족관계증명서"
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                    />
                )}
            </div>
        </div>
    );
}