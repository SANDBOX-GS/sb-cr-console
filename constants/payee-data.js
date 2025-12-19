export const BUSINESS_TYPE_LABEL = {
  individual: "개인",
  sole_proprietor: "개인 사업자",
  corporate_business: "법인 사업자",
};

export const ID_DOCUMENT_TYPE_LABEL = [
  {
    resident_card: "주민등록증",
    drivers_license: "운전면허증",
    passport: "여권",
    resident_register: "주민등록등본",
    forigner_card: "외국인등록증",
  },
];
export const TAX_ISSUE_TYPE_LABEL = {
  tax_invoice: "세금계산서",
  electronic_invoice: "전자계산서",
  cash_receipt: "현금영수증",
  individual: "개인",
};

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

// src/constants/payeeFormSchema.js

/**
 * 사업자 구분
 * - individual: 개인
 * - sole_proprietor: 개인사업자
 * - corporate_business: 법인사업자
 * @typedef {"individual" | "sole_proprietor" | "corporate_business"} BizType
 */

/**
 * 세금계산서 발행 유형
 * - "tax_invoice" | "electronic_invoice" | "cash_receipt" | "individual"
 *   (실제 값은 ISSUE_TYPES 상수와 반드시 일치해야 함)
 * @typedef {"tax_invoice" | "electronic_invoice" | "cash_receipt" | "individual"} InvoiceType
 */

/**
 * 수취정보 유효기간 선택값
 * - "30": 30일간 동일한 정보로 정산
 * - "1": 정산 시마다 수취정보 재확인
 * @typedef {"30" | "1" | ""} ExpiryOption
 */

/**
 * 수취인(개인/사업자) 기본 정보
 * - 개인 / 사업자 / 법인 공통 + 조건부 필드 포함
 * @typedef {Object} RecipientInfo
 * @property {BizType} biz_type                     - 사업자 구분
 * @property {boolean} is_overseas                  - 해외 거주 여부
 * @property {boolean} is_minor                     - 미성년자 여부
 * @property {boolean} is_foreigner                 - 외국인 여부
 *
 * // 개인(내국인) 정보
 * @property {string} real_name                     - 본명 (내국인)
 * @property {string} id_number                     - 주민등록번호 (내국인)
 * @property {string} id_document_type              - 신분증 종류 (내국인, 미성년자/외국인 제외)
 *
 * // 개인(외국인) 정보
 * @property {string} foreigner_name                - 외국인 본명
 * @property {string} foreigner_registration_number - 외국인등록번호
 *
 * // 사업자/법인 정보
 * @property {string} business_name                 - 상호명/법인명
 * @property {string} business_number               - 사업자등록번호/법인등록번호
 *
 * // 법정대리인
 * @property {string} guardian_name                 - 법정대리인 이름
 * @property {string} guardian_phone                - 법정대리인 연락처
 */

/**
 * 계좌 정보
 * @typedef {Object} AccountInfo
 * @property {string} bank_name     - 은행명
 * @property {string} account_holder - 예금주
 * @property {string} account_number - 계좌번호
 * @property {string} swift_code     - 해외 계좌 SWIFT CODE (해외 거주자일 때 필수)
 * @property {string} bank_address   - 해외 은행 주소 (해외 거주자일 때 필수)
 */

/**
 * 세무 정보
 * @typedef {Object} TaxInfo
 * @property {boolean} is_simple_taxpayer - 간이과세자 여부
 * @property {InvoiceType} invoice_type   - 발행 유형
 * @property {ExpiryOption} [expiry_date] - 수취정보 유효기간 선택값
 */

/**
 * 업로드 파일 정보
 * @typedef {Object} PayeeFiles
 * @property {File|null} business_document            - 사업자등록증/법인등록증
 * @property {File|null} id_document                  - 신분증/외국인등록증
 * @property {File|null} bank_document                - 통장 사본
 * @property {File|null} family_relation_certificate  - 가족관계증명서 (미성년자)
 */

/**
 * 수취인 정보 등록/수정 화면에서 사용하는 전체 폼 데이터 구조
 * @typedef {Object} PayeeFormData
 * @property {RecipientInfo} recipientInfo
 * @property {AccountInfo}   accountInfo
 * @property {TaxInfo}       taxInfo
 * @property {PayeeFiles}    files
 */

/**
 * 폼 초기값 (등록 페이지에서 사용)
 * - 기존 page.jsx의 초기 formData를 그대로 옮겨옴
 * @type {PayeeFormData}
 */
export const INITIAL_PAYEE_FORM_DATA = {
  recipientInfo: {
    biz_type: "individual",
    is_overseas: false,
    is_minor: false,
    is_foreigner: false,

    real_name: "",
    id_number: "",
    id_document_type: "",
    foreigner_name: "",
    foreigner_registration_number: "",

    business_name: "",
    business_number: "",

    guardian_name: "",
    guardian_phone: "",
  },
  accountInfo: {
    bank_name: "",
    account_holder: "",
    account_number: "",
    swift_code: "",
    bank_address: "",
  },
  taxInfo: {
    is_simple_taxpayer: false,
    invoice_type: "tax_invoice",
    expiry_date: "", // 기본값: 미선택 상태
  },
  files: {
    business_document: null,
    id_document: null,
    bank_document: null,
    family_relation_certificate: null,
  },
};

/**
 * 메타데이터 구조
 * - 현재 공유된 코드 기준으로는 정확한 필드 목록을 알 수 없음.
 * - API 응답/뷰 페이지(route: payee-info/view) 분석 후 확정 필요.
 *
 * @typedef {Object<string, any>} PayeeMetadata
 */
