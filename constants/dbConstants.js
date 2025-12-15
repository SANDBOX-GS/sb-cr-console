export const TABLE_NAMES = {
    SBN_MEMBER: 'sb_cr_console_member',
    SBN_MEMBER_PAYEE: 'sb_cr_console_member_payee',
    SBN_FILE_INFO: 'sb_cr_console_file_info',
    SBN_PAYEE_REQUEST: 'sb_cr_console_payee_request',
    SBN_PAYEE_REQUEST_LOG: 'sb_cr_console_payee_send_log',
};

// 먼데이닷컴 보드 ID 상수
export const MONDAY_BOARD_IDS = {
    PAYEE_REQUEST: 5024220056,
    WORK_SETTLEMENT: 1930292711,
};

// 먼데이닷컴 컬럼 ID 상수 (보드별로 관리)
export const MONDAY_COLUMN_IDS = {
    PAYEE_REQUEST: {
        EMAIL: 'email_mkxszhjr',                         // 이메일 컬럼 ('email')
        STATUS: 'status',                                // 상태 컬럼 ('Label')
        PHONE: 'phone_mkxsanv2',                         // 전화번호 컬럼 ('phone')
        MIRROR_CR_NAME: 'board_relation_mkxsn9r6',       // CR인벤 미러 컬럼

        // 이전 SQL에서 확인된 연동 컬럼 ID들
        LINK_CR_INVENTORY: 'board_relation_mkxsn9r6',    // CR 인벤토리 연동 컬럼
        LINK_TASK_SETTLEMENT: 'board_relation_mkxsa8rp', // 과업 정산 연동 컬럼
    },
    WORK_SETTLEMENT: {
        STATUS: 'color_mkygz7n5' // 상태 컬럼 ('Label')
    }
};

// 먼데이닷컴 API 설정 상수
export const MONDAY_API_CONFIG = {
    URL: "https://api.monday.com/v2",
    TOKEN: process.env.MONDAY_API_TOKEN, // .env에서 가져옴
};

// NHN Cloud API 설정
export const NHN_CONFIG = {
    EMAIL: {
        URL: `https://email.api.nhncloudservice.com/email/v2.1/appKeys/${process.env.NHN_EMAIL_APP_KEY}/sender/mail`,
        AD_URL: `https://email.api.nhncloudservice.com/email/v2.1/appKeys/${process.env.NHN_EMAIL_APP_KEY}/sender/ad-mail`,
        SECRET_KEY: process.env.NHN_EMAIL_SECRET_KEY,
        SENDER_EMAIL: 'no-reply@sandbox.co.kr', // 발신자 이메일 (NHN에 등록된 발신자)
        TEMPLATE_ID: 'basic_template_002',
    },
    KAKAO: {
        URL: `https://api-alimtalk.cloud.toast.com/alimtalk/v2.3/appkeys/${process.env.NHN_KAKAO_APP_KEY}/messages`,
        SECRET_KEY: process.env.NHN_KAKAO_SECRET_KEY,
        SENDER_KEY: '025bce653e7eecbdbc0e36d2c857d298fd34b333', // NHN에 등록된 발신 프로필 키
        TEMPLATE_CODE: 'cr_finance_001',
    }
};