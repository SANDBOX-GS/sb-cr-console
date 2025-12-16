import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CreditCardIcon, ChevronDownIcon } from "lucide-react";
import { FilePreview } from "./FilePreview";

export function AccountInfoSection({
                                       isOpen,
                                       onOpenChange,
                                       accountInfo,
                                       isOverseas,
                                       maskAccountNumber,
                                       renderEditField,
                                       setFormData,
                                       errors,
                                   }) {
    return (
        <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                                <CreditCardIcon className="w-4 h-4 text-cyan-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">계좌 정보</h4>
                        </div>
                        <ChevronDownIcon
                            className={`h-5 w-5 text-slate-500 transition-transform ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6">
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600">은행명</Label>
                                <p className="text-slate-800 font-medium">
                                    {accountInfo.bankName}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">계좌번호</Label>
                                <p className="text-slate-800 font-medium">
                                    {maskAccountNumber(accountInfo.accountNumber)}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600">예금주</Label>
                                <p className="text-slate-800 font-medium">
                                    {accountInfo.accountHolder}
                                </p>
                            </div>
                        </div>

                        {/* 통장 사본 파일 업로드 */}
                        <FilePreview file={accountInfo.bankDocument} label="통장 사본" />

                        {/* 해외 계좌 정보 */}
                        {isOverseas && (
                            <div className="space-y-6 p-4 bg-sky-50 rounded-xl">
                                <h4 className="font-medium text-slate-800">해외 계좌 정보</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderEditField(
                                        "SWIFT CODE",
                                        accountInfo.swiftCode || "",
                                        (value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                accountInfo: {
                                                    ...prev.accountInfo,
                                                    swiftCode: value,
                                                },
                                            })),
                                        true,
                                        "text",
                                        "SWIFT CODE를 입력하세요",
                                        errors.swiftCode
                                    )}
                                    {renderEditField(
                                        "은행 주소",
                                        accountInfo.bankAddress || "",
                                        (value) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                accountInfo: {
                                                    ...prev.accountInfo,
                                                    bankAddress: value,
                                                },
                                            })),
                                        true,
                                        "text",
                                        "은행 주소를 입력하세요",
                                        errors.bankAddress
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}