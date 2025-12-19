/**
 * =============================
 *  사업자 유형 (biz_type)
 * =============================
 * individual          : 개인
 * sole_proprietor     : 개인사업자
 * corporate_business  : 법인사업자
 */
export const BIZ_TYPES = {
  INDIVIDUAL: "individual",
  SOLE_PROPRIETOR: "sole_proprietor",
  CORPORATE_BUSINESS: "corporate_business",
};

/**
 * =============================
 *  세금계산서 발행 유형 (invoice_type)
 * =============================
 */
export const INVOICE_TYPES = {
  TAX_INVOICE: "tax_invoice",
  ELECTRONIC_INVOICE: "electronic_invoice",
  CASH_RECEIPT: "cash_receipt",
  INDIVIDUAL: "individual",
};

/**
 * =============================
 *  수취정보 유효기간 (expiry_date)
 * =============================
 * "30" → 30일간 동일 정보 사용
 * "1"  → 정산 시마다 정보 재확인
 */
export const EXPIRY_OPTIONS = {
  THIRTY_DAYS: "30days",
  EVERYTIME: "once",
};

/**
 * 전체 수취인 formData 구조 (snake_case 기준)
 * 실제 API 입력/출력과 동일한 구조를 유지한다.
 */
export const INITIAL_PAYEE_FORM_DATA = {
  basic_info: {
    consent_type: "", // 30days / once / ""
  },
  recipient_info: {
    biz_type: "individual",
    is_overseas: false, // 해외거주 여부
    is_minor: false, // 미성년자 여부
    is_foreigner: false, // 외국인 여부

    // 개인(내국인)
    user_name: "",
    ssn: "",
    identification_type: "", // resident_id, driver_license 등

    // 개인(외국인)
    user_name: "",
    ssn: "",
    identification_type: "",

    // 사업자 / 법인
    biz_name: "",
    biz_reg_no: "",

    // 법정대리인 (미성년자)
    guardian_name: "",
    guardian_tel: "",
  },

  account_info: {
    bank_name: "",
    account_holder: "",
    account_number: "",
    swift_code: "", // 해외 계좌일 경우
    bank_address: "", // 해외 은행 주소
  },

  tax_info: {
    is_simple_taxpayer: false,
    invoice_type: "tax_invoice",
  },

  files: {
    business_document: null, // 사업자등록증/법인등록증
    id_document: null, // 신분증/외국인등록증
    bank_document: null, // 통장사본
    family_relation_certificate: null, // 미성년자 가족관계증명서
  },
};
/**
 * Payee Metadata
 * - API에서 내려오는 메타 정보
 * - last_modified, created_at, status 등은 서비스 정책에 따라 확장 가능
 */
export const INITIAL_PAYEE_METADATA = {
  created_at: null,
  updated_at: null,
  expired_status: "", // active, expired 등
  agree_expired_at: "",
  // 추후 metadata.* 필드가 확정되면 여기에 명세 추가
};
/**
 * Payee Page 전체 상태 구조
 */
export const INITIAL_PAYEE_STATE = {
  form_data: INITIAL_PAYEE_FORM_DATA,
  metadata: INITIAL_PAYEE_METADATA,
};
