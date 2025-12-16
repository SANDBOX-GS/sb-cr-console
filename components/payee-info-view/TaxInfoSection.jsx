import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileTextIcon, ChevronDownIcon } from "lucide-react";
import { ISSUE_TYPES } from "@/constants/payee-data";

/**
 * @typedef {object} TaxInfo
 * @property {boolean} isSimpleTax 간이과세자 여부
 * @property {('tax_invoice' | 'electronic_invoice' | 'cash_receipt' | 'individual' | 'other')} issueType 발행 유형
 * @property {('business' | 'other')} [incomeType] 소득 종류
 * @property {boolean} [issueTaxInvoice] 세금계산서 발급 여부
 * @property {string} [managerName] 담당자명
 * @property {string} [managerPhone] 담당자 연락처
 * @property {string} [managerEmail] 담당자 이메일
 * @property {boolean} [withholding] 원천징수 여부
 */

/**
 * @typedef {object} TaxInfoSectionProps
 * @property {boolean} isOpen 섹션 열림 상태
 * @property {(open: boolean) => void} onOpenChange 섹션 열림/닫힘 핸들러
 * @property {TaxInfo} taxInfo 세무 정보 데이터
 */

/**
 * 세무 정보(발행 유형, 소득 종류, 세금계산서 발급 정보)를 요약해서 보여주는 접이식(Collapsible) 섹션입니다.
 * @param {TaxInfoSectionProps} props
 */
export function TaxInfoSection({ isOpen, onOpenChange, taxInfo }) {
    const getSelectedIssueType = () => {
        return ISSUE_TYPES.find((type) => type.value === taxInfo.issueType);
    };

    return (
        <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileTextIcon className="w-4 h-4 text-purple-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">세무 정보</h4>
                        </div>
                        <ChevronDownIcon
                            className={`h-5 w-5 text-slate-500 transition-transform ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-6 pb-6">
                    <div className="space-y-6 pt-4 border-t border-slate-200">
                        {/* 발행 유형 */}
                        <div className="space-y-2">
                            <Label className="text-slate-600">발행 유형</Label>
                            <div className="p-4 bg-slate-50 rounded-xl border">
                                <div className="text-sm font-medium text-slate-800 mb-1">
                                    {getSelectedIssueType()?.label || "-"}
                                </div>
                                <div className="text-xs text-slate-600 mb-2">
                                    {getSelectedIssueType()?.description}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {getSelectedIssueType()?.detail}
                                </div>
                            </div>
                        </div>

                        {/* 소득 종류 */}
                        <div className="space-y-2">
                            <Label className="text-slate-600">소득 종류</Label>
                            <p className="text-slate-800 font-medium">
                                {taxInfo?.incomeType === "business"
                                    ? "사업소득"
                                    : taxInfo?.incomeType === "other"
                                        ? "기타소득"
                                        : "-"}
                            </p>
                        </div>

                        {/* 세금 계산서 발급 여부 */}
                        <div className="space-y-2">
                            <Label className="text-slate-600">세금 계산서 발급 여부</Label>
                            <p className="text-slate-800 font-medium">
                                {taxInfo?.issueTaxInvoice === true
                                    ? "발급 요청"
                                    : taxInfo?.issueTaxInvoice === false
                                        ? "발급 불요"
                                        : "-"}
                            </p>
                        </div>

                        {/* 세금계산서 발급 요청시 담당자 정보 */}
                        {taxInfo?.issueTaxInvoice && (
                            <div className="space-y-4 p-4 bg-sky-50 rounded-xl">
                                <h4 className="font-medium text-slate-800">
                                    세금계산서 발급 정보
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">담당자명</Label>
                                        <p className="text-slate-800 font-medium">
                                            {taxInfo?.managerName || "-"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">담당자 연락처</Label>
                                        <p className="text-slate-800 font-medium">
                                            {taxInfo?.managerPhone || "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600">담당자 이메일</Label>
                                    <p className="text-slate-800 font-medium">
                                        {taxInfo?.managerEmail || "-"}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 원천징수 여부 */}
                        <div className="space-y-2">
                            <Label className="text-slate-600">원천징수 여부</Label>
                            <p className="text-slate-800 font-medium">
                                {taxInfo?.withholding === true
                                    ? "원천징수 적용"
                                    : taxInfo?.withholding === false
                                        ? "원천징수 미적용"
                                        : "-"}
                            </p>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}