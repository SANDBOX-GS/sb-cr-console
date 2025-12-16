import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileTextIcon } from "lucide-react";
import { formatPhoneNumber } from "@/utils/formatters";
import { ISSUE_TYPES } from "@/constants/payee-data";

/**
 * @typedef {object} TaxInfo
 * @property {boolean} isSimpleTax 간이과세자 여부
 * @property {('tax_invoice' | 'electronic_invoice' | 'cash_receipt' | 'individual')} issueType 발행 유형
 * @property {boolean} issueTaxInvoice 세금계산서 발급 여부 (issueType에 따라 결정)
 * @property {string} [managerName] 담당자명
 * @property {string} [managerPhone] 담당자 연락처
 * @property {string} [managerEmail] 담당자 이메일
 */

/**
 * @typedef {object} FormErrors
 * @property {string} [issueType] 발행 유형 오류
 * @property {string} [managerName] 담당자명 오류
 * @property {string} [managerPhone] 담당자 연락처 오류
 * @property {string} [managerEmail] 담당자 이메일 오류
 */

/**
 * @typedef {object} TaxEditFormProps
 * @property {{ taxInfo: TaxInfo }} formData 폼 데이터 객체
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
 * 세무 정보를 수정하는 폼 컴포넌트입니다.
 * @param {TaxEditFormProps} props
 */
export function TaxEditForm({
                                formData,
                                setFormData,
                                errors,
                                renderEditField,
                            }) {
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <FileTextIcon className="w-4 h-4 text-amber-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">세무 정보 수정</h4>
            </div>

            {/* 간이과세자 여부 */}
            <div className="mb-6">
                <Label className="text-slate-600 mb-3 block">간이과세자 여부</Label>
                <RadioGroup
                    value={formData.taxInfo.isSimpleTax ? "true" : "false"}
                    onValueChange={(value) =>
                        setFormData((prev) => ({
                            ...prev,
                            taxInfo: {
                                ...prev.taxInfo,
                                isSimpleTax: value === "true",
                            },
                        }))
                    }
                    className="flex gap-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="simple-yes" />
                        <Label htmlFor="simple-yes" className="text-slate-700">
                            예
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="simple-no" />
                        <Label htmlFor="simple-no" className="text-slate-700">
                            아니오
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* 발행 유형 */}
            <div className="mb-6">
                <Label className="text-slate-600 mb-3 block">
                    발행 유형 <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                    value={formData.taxInfo.issueType}
                    onValueChange={(value) =>
                        setFormData((prev) => ({
                            ...prev,
                            taxInfo: {
                                ...prev.taxInfo,
                                issueType: value,
                            },
                        }))
                    }
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {ISSUE_TYPES.map((type) => (
                        <div
                            key={type.value}
                            className={`relative border-2 rounded-xl p-4 transition-all ${
                                formData.taxInfo.issueType === type.value
                                    ? "border-sky-500 bg-sky-50"
                                    : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem
                                    value={type.value}
                                    id={type.value}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <Label
                                        htmlFor={type.value}
                                        className="cursor-pointer flex-col items-start"
                                    >
                                        <div className="flex items-center space-x-2 justify-center">
                                            <div className="font-medium text-slate-800">
                                                {type.label}
                                            </div>
                                            <div className="text-sm text-sky-600 font-medium">
                                                {type.description}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {type.detail}
                                        </div>
                                    </Label>
                                </div>
                            </div>
                        </div>
                    ))}
                </RadioGroup>
                {errors.issueType && (
                    <p className="text-red-500 text-sm mt-2">{errors.issueType}</p>
                )}
            </div>

            {/* 세금계산서 발급시 담당자 정보 */}
            {formData.taxInfo.issueTaxInvoice && (
                <div className="mt-6 p-6 bg-sky-50 rounded-xl border border-sky-200">
                    <h5 className="text-lg font-medium text-slate-800 mb-4">
                        담당자 정보
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderEditField(
                            "담당자명",
                            formData.taxInfo.managerName || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    taxInfo: {
                                        ...prev.taxInfo,
                                        managerName: value,
                                    },
                                })),
                            true,
                            "text",
                            "담당자명을 입력하세요",
                            errors.managerName
                        )}

                        {renderEditField(
                            "담당자 연락처",
                            formData.taxInfo.managerPhone || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    taxInfo: {
                                        ...prev.taxInfo,
                                        managerPhone: formatPhoneNumber(value),
                                    },
                                })),
                            true,
                            "tel",
                            "010-0000-0000",
                            errors.managerPhone
                        )}

                        <div className="md:col-span-2">
                            {renderEditField(
                                "담당자 이메일",
                                formData.taxInfo.managerEmail || "",
                                (value) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        taxInfo: {
                                            ...prev.taxInfo,
                                            managerEmail: value,
                                        },
                                    })),
                                true,
                                "email",
                                "example@email.com",
                                errors.managerEmail
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}