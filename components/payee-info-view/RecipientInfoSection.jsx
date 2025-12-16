import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserIcon, ChevronDownIcon } from "lucide-react";
import { FilePreview } from "./FilePreview";

/**
 * @typedef {object} RecipientInfo
 * @property {('individual' | 'sole_proprietor' | 'corporate_business')} businessType 사업자 구분
 * @property {boolean} isOverseas 해외 거주자 여부
 * @property {boolean} isMinor 미성년자 여부
 * @property {boolean} isForeigner 외국인 여부
 * @property {string} [businessName] 사업자명
 * @property {string} [businessNumber] 사업자번호
 * @property {File} [businessDocument] 사업자등록증 파일
 * @property {string} [realName] 본명 (내국인)
 * @property {string} [idNumber] 주민등록번호 (내국인)
 * @property {('resident_card' | 'drivers_license' | 'passport' | 'resident_register')} [idDocumentType] 신분증 종류
 * @property {File} [idDocument] 신분증 사본 파일
 * @property {string} [guardianName] 법정대리인 본명
 * @property {string} [guardianPhone] 법정대리인 연락처
 * @property {File} [familyRelationCertificate] 가족관계증명서 파일
 * @property {string} [foreignerName] 본명 (외국인)
 * @property {string} [foreignerRegistrationNumber] 외국인등록번호
 * @property {File} [foreignerRegistrationCard] 외국인등록증 파일
 */

/**
 * @typedef {object} RecipientInfoSectionProps
 * @property {boolean} isOpen 섹션 열림 상태
 * @property {(open: boolean) => void} onOpenChange 섹션 열림/닫힘 핸들러
 * @property {RecipientInfo} recipientInfo 수취인 정보 데이터
 * @property {(idNumber: string) => string} maskIdNumber 주민등록번호 마스킹 유틸리티
 * @property {(
 * label: string,
 * value: string,
 * onChange: (value: string) => void,
 * required?: boolean,
 * type?: string,
 * placeholder?: string,
 * error?: string
 * ) => JSX.Element} renderEditField 사용자 정의 입력 필드 렌더링 함수 (수정 모드용)
 * @property {(value: string) => string} formatPhoneNumber 전화번호 포맷팅 유틸리티
 * @property {(updater: (prev: any) => any) => void} setFormData 폼 데이터 업데이트 함수
 * @property {{ [key: string]: string }} errors 유효성 검사 오류 객체
 */

const ID_DOCUMENT_TYPES = [
    { value: "resident_card", label: "주민등록증" },
    { value: "drivers_license", label: "운전면허증" },
    { value: "passport", label: "여권" },
    { value: "resident_register", label: "주민등록등본" },
];

/**
 * 수취인 정보를 표시하고 수정할 수 있는 접이식(Collapsible) 섹션입니다.
 * @param {RecipientInfoSectionProps} props
 */
export function RecipientInfoSection({
                                         isOpen,
                                         onOpenChange,
                                         recipientInfo,
                                         maskIdNumber,
                                         // renderEditField, // 🚨 수정 모드에서만 사용되므로 이 컴포넌트에서는 제거 가능 (현재 View 전용)
                                         formatPhoneNumber,
                                         // setFormData,    // 🚨 수정 모드에서만 사용되므로 제거
                                         // errors,
                                     }) {
    // 헬퍼 함수: ID Document Type의 label을 찾습니다.
    const getIdDocumentLabel = (value) => {
        return ID_DOCUMENT_TYPES.find((doc) => doc.value === value)?.label || "-";
    };

    // 헬퍼 함수: 사업자 구분 라벨
    const getBusinessTypeLabel = (type) => {
        switch (type) {
            case "individual":
                return "개인";
            case "sole_proprietor":
                return "개인사업자";
            case "corporate_business":
                return "법인사업자";
            default:
                return "-";
        }
    };

    return (
        <Collapsible open={isOpen} onOpenChange={onOpenChange}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg">
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-sky-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">수취인 정보</h4>
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
                        {/* 1. 사업자 구분 및 추가 옵션 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 사업자 구분 */}
                            <div className="space-y-2">
                                <Label className="text-slate-600">사업자 구분</Label>
                                <p className="text-slate-800 font-medium">
                                    {getBusinessTypeLabel(recipientInfo.businessType)}
                                </p>
                            </div>

                            {/* 추가 옵션 (개인인 경우에만 표시) */}
                            {recipientInfo.businessType === "individual" && (
                                <div className="space-y-2">
                                    <Label className="text-slate-600">추가 옵션</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {recipientInfo.isOverseas && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-sky-100 text-sky-700"
                                            >
                                                해외 거주자
                                            </Badge>
                                        )}
                                        {recipientInfo.isMinor && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-orange-100 text-orange-700"
                                            >
                                                미성년자
                                            </Badge>
                                        )}
                                        {recipientInfo.isForeigner && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-purple-100 text-purple-700"
                                            >
                                                외국인
                                            </Badge>
                                        )}
                                        {!recipientInfo.isOverseas &&
                                            !recipientInfo.isMinor &&
                                            !recipientInfo.isForeigner && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-slate-100 text-slate-600"
                                                >
                                                    해당사항 없음
                                                </Badge>
                                            )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. 개인 정보 필드 (개인인 경우) */}
                        {recipientInfo.businessType === "individual" && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">성명</Label>
                                        <p className="text-slate-800 font-medium">
                                            {recipientInfo.isForeigner
                                                ? recipientInfo.foreignerName || "-"
                                                : recipientInfo.realName || "-"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">
                                            {recipientInfo.isForeigner
                                                ? "외국인등록번호"
                                                : "주민등록번호"}
                                        </Label>
                                        <p className="text-slate-800 font-medium">
                                            {recipientInfo.isForeigner
                                                ? recipientInfo.foreignerRegistrationNumber || "-"
                                                : maskIdNumber(recipientInfo.idNumber || "")}
                                        </p>
                                    </div>
                                    {/* 신분증 종류 (미성년자/외국인 아닐 경우) */}
                                    {!recipientInfo.isMinor && !recipientInfo.isForeigner && (
                                        <div className="space-y-2">
                                            <Label className="text-slate-600">신분증 종류</Label>
                                            <p className="text-slate-800 font-medium">
                                                {getIdDocumentLabel(recipientInfo.idDocumentType)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* 신분증/등록증 파일 업로드 */}
                                {!recipientInfo.isForeigner && !recipientInfo.isMinor && (
                                    <FilePreview
                                        file={recipientInfo.idDocument}
                                        label="신분증 사본"
                                    />
                                )}
                                {recipientInfo.isForeigner && (
                                    <FilePreview
                                        file={recipientInfo.foreignerRegistrationCard}
                                        label="외국인등록증 사본"
                                    />
                                )}

                                {/* 법정대리인 정보 (미성년자인 경우) */}
                                {recipientInfo.isMinor && (
                                    <div className="space-y-6 p-4 bg-red-50 rounded-xl border border-red-100">
                                        <h4 className="font-medium text-slate-800">
                                            법정대리인 정보
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* 🚨 [수정]: 법정대리인 본명 - Read-Only 텍스트로 변경 */}
                                            <div className="space-y-2">
                                                <Label className="text-slate-600">
                                                    법정대리인 본명
                                                </Label>
                                                <p className="text-slate-800 font-medium">
                                                    {recipientInfo.guardianName || "-"}
                                                </p>
                                            </div>

                                            {/* 🚨 [수정]: 법정대리인 연락처 - Read-Only 텍스트로 변경 */}
                                            <div className="space-y-2">
                                                <Label className="text-slate-600">
                                                    법정대리인 연락처
                                                </Label>
                                                <p className="text-slate-800 font-medium">
                                                    {formatPhoneNumber(
                                                        recipientInfo.guardianPhone || ""
                                                    ) || "-"}
                                                </p>
                                            </div>
                                        </div>
                                        <FilePreview
                                            file={recipientInfo.familyRelationCertificate}
                                            label="가족관계증명서"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {/* 3. 사업자 정보 필드 (사업자 구분인 경우) */}
                        {(recipientInfo.businessType === "sole_proprietor" ||
                            recipientInfo.businessType === "corporate_business") && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">
                                            {recipientInfo.businessType === "corporate_business"
                                                ? "법인명"
                                                : "상호명"}
                                        </Label>
                                        <p className="text-slate-800">
                                            {recipientInfo.businessName || "-"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-600">
                                            {recipientInfo.businessType === "corporate_business"
                                                ? "법인등록번호"
                                                : "사업자등록번호"}
                                        </Label>
                                        <p className="text-slate-800">
                                            {recipientInfo.businessNumber || "-"}
                                        </p>
                                    </div>
                                </div>
                                <FilePreview
                                    file={recipientInfo.businessDocument}
                                    label={
                                        recipientInfo.businessType === "corporate_business"
                                            ? "법인등록증"
                                            : "사업자등록증"
                                    }
                                />
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}