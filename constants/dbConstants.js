export const TABLE_NAMES = {
  SBN_MEMBER: "sb_cr_console_member",
  SBN_MEMBER_PAYEE: "sb_cr_console_member_payee",
  SBN_MEMBER_PAYEE_LOG: "sb_cr_console_member_payee_log",
  SBN_FILE_INFO: "sb_cr_console_file_info",
  SBN_PAYEE_REQUEST: "sb_cr_console_payee_request",
  SBN_PAYEE_REQUEST_LOG: "sb_cr_console_payee_request_log",
  SBN_SEND_LOG: "sb_cr_console_send_log",
}

export const COLUMN_NAMES = {
  SBN_MEMBER_PAYEE: {
    USER_ID: "user_id",
  },
}

// 먼데이닷컴 보드 ID 상수
export const MONDAY_BOARD_IDS = {
  PAYEE_INFO: 5025498925, // 외부 CR - 수취인 개인 정보
  PAYEE_REQUEST: 5024220056, // 외부 CR - 수취인 정보 요청
  PAYEE_LOG: 5024220117, // 외부 CR - 수취인 개인 정보 수정 이력
  WORK_SETTLEMENT: 1930292711, // 과업 정산
}

// 먼데이닷컴 컬럼 ID 상수 (보드별로 관리)
export const MONDAY_COLUMN_IDS = {
  PAYEE_REQUEST: {
    EMAIL: "email_mkxszhjr", // 이메일 컬럼 ('email')
    STATUS: "status", // 상태 컬럼 ('Label')
    PHONE: "phone_mkxsanv2", // 전화번호 컬럼 ('phone')
    MIRROR_CR_NAME: "board_relation_mkxsn9r6", // CR인벤 미러 컬럼

    // 이전 SQL에서 확인된 연동 컬럼 ID들
    LINK_CR_INVENTORY: "board_relation_mkxsn9r6", // CR 인벤토리 연동 컬럼
    LINK_TASK_SETTLEMENT: "board_relation_mkxsa8rp", // 과업 정산 연동 컬럼
    PAYEE_INFO: "board_relation_mkxtff2q", // 외부 CR 수취인 정보
    PAYEE_REGISTER_STATE: "color_mkxsfvkn", // 수취정보 등록단계
    AGREE_STATE: "color_mkxs71cp", // 정보 동의 상태
  },
  WORK_SETTLEMENT: {
    STATUS: "color_mkygz7n5", // 상태 컬럼 ('Label')
  },
  PAYEE_LOG: {
    VERSION: "numeric_mkz4a4sa", // 업데이트 버전
    CREATED_TYPE: "color_mkxjtezh", // 액션 구분 (상태)
    BIZ_TYPE_STATUS: "color_mkxtxram", // 사업자 구분 (상태)
    INVOICE_TYPE: "dropdown_mkxtyexm", // 발행 유형 (드롭다운)
    TAX: "numeric_mkz5jt0b", // 과세율 (숫자)
    CORP_NAME: "long_text_mkxt6ds1", // 법인명
    BIZ_REG_NO: "text_mkxt31vr", // 사업자등록번호
    BIZ_REG_FILE: "file_mkxtev4k", // 사업자등록증 (파일)
    USER_NAME: "text_mkxtba0q", // 본명
    SSN: "text_mkxts5rz", // 주민등록번호
    PHONE: "phone_mkxtstbk", // 휴대폰 번호
    EMAIL: "email_mkxt1k94", // 이메일
    ID_FILE: "file_mkxtcr5n", // 신분증 (파일)
    FOREIGN_REG_NO: "text_mkxt86q5", // 외국인등록번호
    GUARDIAN_NAME: "text_mkxtsa43", // 법정대리인 성명
    GUARDIAN_PHONE: "phone_mkxt1gnp", // 법정대리인 연락처
    RELATION_FILE: "file_mkxtbw7m", // 가족관계증명서 (파일)
    BANK_NAME: "text_mkxtsrm2", // 은행명
    ACCOUNT_HOLDER: "text_mkxtk278", // 예금주
    ACCOUNT_NUMBER: "text_mkxth905", // 계좌번호
    SWIFT_CODE: "text_mkxtzw24", // SWIFT CODE
    BANK_ADDRESS: "long_text_mkxtrjk1", // 은행 주소
    BANK_COPY_FILE: "file_mkxt4x6w", // 통장사본 (파일)
  },
}

// 먼데이닷컴 API 설정 상수
export const MONDAY_API_CONFIG = {
  URL: "https://api.monday.com/v2",
  TOKEN: process.env.MONDAY_API_TOKEN, // .env에서 가져옴
}

// NHN Cloud API 설정
export const NHN_CONFIG = {
  EMAIL: {
    URL: `https://email.api.nhncloudservice.com/email/v2.1/appKeys/${process.env.NHN_EMAIL_APP_KEY}/sender/mail`,
    AD_URL: `https://email.api.nhncloudservice.com/email/v2.1/appKeys/${process.env.NHN_EMAIL_APP_KEY}/sender/ad-mail`,
    SECRET_KEY: process.env.NHN_EMAIL_SECRET_KEY,
    SENDER_EMAIL: "no-reply@sandbox.co.kr", // 발신자 이메일 (NHN에 등록된 발신자)
    TEMPLATE_ID: "basic_template_002",
  },
  KAKAO: {
    URL: `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${process.env.NHN_KAKAO_APP_KEY}/messages`,
    SECRET_KEY: process.env.NHN_KAKAO_SECRET_KEY,
    SENDER_KEY: "025bce653e7eecbdbc0e36d2c857d298fd34b333", // NHN에 등록된 발신 프로필 키
    TEMPLATE_CODE: "cr_console_000",
  },
}

export const IMG_URL =
  "https://sandboxnetwork-public-hosting.s3.ap-northeast-2.amazonaws.com/cr_console"

export const NOTION_PAGE_ID = {
  NOTICE: "1e529436cbac80c78345e0202cb267a9",
  TERMS: "2d329436cbac808b9aa0cae47412bb64",
  PRIVACY: "2d329436cbac80c48fd7f0dc3b286d70",
}
