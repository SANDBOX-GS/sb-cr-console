import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCardIcon } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { KOREAN_BANKS } from "@/constants/payee-data";

export function AccountEditForm({
                                    formData,
                                    setFormData,
                                    errors,
                                    renderEditField,
                                }) {
    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CreditCardIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">
                    계좌 정보 수정
                </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-slate-600">
                        은행명{" "}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={formData.accountInfo.bankName}
                        onValueChange={(value) =>
                            setFormData((prev) => ({
                                ...prev,
                                accountInfo: {
                                    ...prev.accountInfo,
                                    bankName: value,
                                },
                            }))
                        }
                    >
                        <SelectTrigger
                            className={`bg-white/50 ${errors.bankName ? "border-red-400" : ""}`}
                        >
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
                    {errors.bankName && (
                        <p className="text-red-500 text-sm">
                            {errors.bankName}
                        </p>
                    )}
                </div>

                {renderEditField(
                    "예금주",
                    formData.accountInfo.accountHolder,
                    (value) =>
                        setFormData((prev) => ({
                            ...prev,
                            accountInfo: {
                                ...prev.accountInfo,
                                accountHolder: value,
                            },
                        })),
                    true,
                    "text",
                    "예금주명을 입력하세요",
                    errors.accountHolder,
                )}

                {renderEditField(
                    "계좌번호",
                    formData.accountInfo.accountNumber,
                    (value) =>
                        setFormData((prev) => ({
                            ...prev,
                            accountInfo: {
                                ...prev.accountInfo,
                                accountNumber: value,
                            },
                        })),
                    true,
                    "text",
                    "계좌번호를 입력하세요",
                    errors.accountNumber,
                )}

                {formData.recipientInfo.isOverseas && (
                    <>
                        {renderEditField(
                            "SWIFT 코드",
                            formData.accountInfo.swiftCode || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    accountInfo: {
                                        ...prev.accountInfo,
                                        swiftCode: value,
                                    },
                                })),
                            false,
                            "text",
                            "SWIFT 코드를 입력하세요",
                        )}

                        {renderEditField(
                            "은행 주소",
                            formData.accountInfo.bankAddress || "",
                            (value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    accountInfo: {
                                        ...prev.accountInfo,
                                        bankAddress: value,
                                    },
                                })),
                            false,
                            "text",
                            "은행 주소를 입력하세요",
                        )}
                    </>
                )}
            </div>

            <div className="mt-6">
                <FileUpload
                    file={formData.accountInfo.bankDocument}
                    onChange={(file) =>
                        setFormData((prev) => ({
                            ...prev,
                            accountInfo: {
                                ...prev.accountInfo,
                                bankDocument: file,
                            },
                        }))
                    }
                    label="통장 사본"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                />
            </div>
        </div>
    );
}