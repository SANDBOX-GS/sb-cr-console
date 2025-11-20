import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditIcon, SaveIcon, XIcon } from "lucide-react";

/**
 * @typedef {'valid' | 'expiring_soon' | 'expired'} ValidityStatus
 */

/**
 * @typedef {object} PayeeData
 * @property {{
 * businessType: ('individual' | 'sole_proprietor' | 'corporate_business');
 * isForeigner: boolean;
 * foreignerName?: string;
 * realName?: string;
 * }} recipientInfo 수취인 정보
 * @property {{
 * bankName: string;
 * accountNumber: string;
 * }} accountInfo 계좌 정보
 */

/**
 * @typedef {object} SummaryCardProps
 * @property {{ start: Date; end: Date | null }} validityPeriod 유효기간 시작/종료일
 * @property {ValidityStatus} validityStatus 유효 상태
 * @property {Date} lastModified 최종 수정일
 * @property {PayeeData} formData 폼 데이터
 * @property {boolean} isEditMode 수정 모드 여부
 * @property {boolean} isLoading 로딩 상태 여부
 * @property {() => void} onEditMode 수정 모드 진입 핸들러
 * @property {() => void} onCancelEdit 수정 취소 핸들러
 * @property {() => void} onSave 저장 핸들러
 * @property {(accountNumber: string) => string} maskAccountNumber 계좌번호 마스킹 유틸리티
 * @property {(date: Date) => string} formatDate 날짜 포맷팅 유틸리티
 * @property {(date: Date) => string} formatDateTime 날짜/시간 포맷팅 유틸리티
 */

/**
 * 상단에 수취 정보를 요약해서 보여주고 수정/저장 버튼을 포함하는 카드 컴포넌트입니다.
 * @param {SummaryCardProps} props
 */
export function SummaryCard({
                                validityPeriod,
                                validityStatus,
                                lastModified,
                                formData,
                                isEditMode,
                                isLoading,
                                onEditMode,
                                onCancelEdit,
                                onSave,
                                maskAccountNumber,
                                formatDate,
                                formatDateTime,
                            }) {
    // 헬퍼: 수취인 이름 가져오기
    const getRecipientName = () => {
        if (formData.recipientInfo.isForeigner) {
            return formData.recipientInfo.foreignerName || '—';
        }
        return formData.recipientInfo.realName || '—';
    };

    // 헬퍼: 유효기간 종료일 라벨
    const getValidityEndLabel = () => {
        if (!validityPeriod.end) return "정보 미등록";
        return `${formatDate(validityPeriod.end)}까지`;
    };

    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-4xl mb-8"
        >
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="mb-6">
                    <div className="w-full flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                        <h3 className="text-xl font-bold text-slate-800">
                            수취 정보 관리
                        </h3>

                        {/* 버튼 영역 - 토글 형태 */}
                        <div className="flex gap-2">
                            {isEditMode ? (
                                <>
                                    {/* 수정 모드일 때: 저장 및 취소 버튼 */}
                                    <Button
                                        variant="outline"
                                        onClick={onCancelEdit}
                                        disabled={isLoading}
                                        className="text-slate-600 hover:text-slate-800"
                                    >
                                        <XIcon className="w-4 h-4 mr-2" />
                                        취소
                                    </Button>
                                    <Button
                                        onClick={onSave}
                                        disabled={isLoading}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <SaveIcon className="w-4 h-4 mr-2" />
                                        {isLoading ? '저장 중...' : '저장'}
                                    </Button>
                                </>
                            ) : (
                                /* 보기 모드일 때: 수정 버튼 */
                                <Button
                                    variant="outline"
                                    onClick={onEditMode}
                                    className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
                                >
                                    <EditIcon className="w-4 h-4 mr-2" />
                                    정보 수정
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 요약 상세 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm pt-4 border-t border-slate-200">

                    {/* 1. 유효기간 */}
                    <div className="space-y-1">
                        <Label className="text-slate-600">유효기간</Label>
                        <p className="font-medium text-slate-800">
                            {getValidityEndLabel()}
                        </p>
                        <Badge
                            variant={
                                validityStatus === "valid" ? "default" : validityStatus === "expiring_soon" ? "secondary" : "destructive"
                            }
                            className={
                                validityStatus === "valid"
                                    ? "bg-green-100 text-green-800"
                                    : validityStatus === "expiring_soon"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-red-100 text-red-800"
                            }
                        >
                            {validityStatus === "valid" ? "유효" : validityStatus === "expiring_soon" ? "만료 임박" : "만료"}
                        </Badge>
                    </div>

                    {/* 2. 수취인 이름 */}
                    <div className="space-y-1">
                        <Label className="text-slate-600">
                            {formData.recipientInfo.businessType !== 'individual' ? '사업자명' : '수취인명'}
                        </Label>
                        <p className="font-medium text-slate-800">
                            {formData.recipientInfo.businessType !== 'individual'
                                ? formData.recipientInfo.businessName || '—'
                                : getRecipientName()}
                        </p>
                    </div>

                    {/* 3. 계좌 정보 */}
                    <div className="space-y-1">
                        <Label className="text-slate-600">계좌번호</Label>
                        <p className="font-medium text-slate-800">
                            {formData.accountInfo.bankName || '—'}
                        </p>
                        <p className="text-sm text-slate-600">
                            {maskAccountNumber(formData.accountInfo.accountNumber || '')}
                        </p>
                    </div>

                    {/* 4. 최종 수정일 */}
                    <div className="space-y-1">
                        <Label className="text-slate-600">최종 수정</Label>
                        <p className="font-medium text-slate-800">
                            {lastModified ? formatDateTime(lastModified) : '—'}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}