/**
 * 신분증 종류 상수
 */
export const ID_DOCUMENT_TYPES = [
    { value: "resident_card", label: "주민등록증" },
    { value: "drivers_license", label: "운전면허증" },
    { value: "passport", label: "여권" },
    { value: "resident_register", label: "주민등록등본" },
];

/**
 * 발행 유형 상수
 */
export const ISSUE_TYPES = [
    {
        value: "tax_invoice",
        label: "세금계산서",
        description: "공급가액+VAT(10%)",
        detail: "사업자등록이 있는 개인사업자 또는 법인사업자에 적용됩니다.",
    },
    {
        value: "electronic_invoice",
        label: "전자계산서",
        description: "공급가액",
        detail: "사업자등록이 없는 프리랜서에게 적용됩니다.",
    },
    {
        value: "cash_receipt",
        label: "현금영수증",
        description: "공급가액",
        detail: "개인이 소득공제를 받고자 할 때 발행됩니다.",
    },
    {
        value: "individual",
        label: "개인",
        description: "공급가액-사업소득세(3.3%)",
        detail: "개인 사업소득으로 신고하는 경우에 적용됩니다.",
    },
];

/**
 * 한국 은행 목록 상수
 */
export const KOREAN_BANKS = [
    "KB국민은행",
    "신한은행",
    "우리은행",
    "하나은행",
    "NH농협은행",
    "IBK기업은행",
    "대구은행",
    "부산은행",
    "경남은행",
    "광주은행",
    "전북은행",
    "제주은행",
    "SC제일은행",
    "씨티은행",
    "새마을금고",
    "신협",
    "우체국",
    "카카오뱅크",
    "케이뱅크",
    "토스뱅크",
];

// --- JSDoc을 사용한 타입 정의 ---

/**
 * @typedef {'valid' | 'expiring_soon' | 'expired'} ValidityStatus
 */

/**
 * @typedef {'30days' | 'once' | null} ConsentType
 */

// 위의 타입 정의는 ES Module 문법상 export를 붙이지 않습니다.
// 대신 JSDoc으로 정의하여 IDE나 툴링에서 타입을 인식하게 합니다.