import {ISSUE_TYPES} from "@/constants/payee-data";

export const MONDAY_LABEL = {
    // [보드] 외부 CR - 수취인 정보 요청 (PAYEE_REQUEST)
    PAYEE_REQUEST: {
        REQUEST_STATE: {
            PENDING: '발송예약',
            SENT: '발송성공',
            FAILED: '발송실패',
            NONE: '해당없음',
        },
        PAYEE_REGISTER_STATE: {
            ACCOUNT_CREATED : '계정 등록완료',
            PENDING : '수취정보 승인 전',
            REJECTED : '수취정보 반려(재등록 안내)',
            APPROVED : '수취정보 승인 완료',
            REGISTERED: '기등록',
            UNREGISTERED: '미등록',
        },
        AGREE_STATE: {
            REQUESTED: '유효기간 갱신 요청',
            AGREED: '유효기간 갱신 동의',
            NONE: '해당없음',
        }
    },

    // [보드] 과업 정산 (WORK_SETTLEMENT)
    WORK_SETTLEMENT: {
        SEND_STATE: {
            PENDING: '발송예약',
            SENT: '발송완료',
            FAILED: '발송실패',
            NONE: '해당없음',
            WAITED: '발송 전',
            ERROR: '예약오류',
        }
    },

    // [보드] 외부 CR - 수취인 개인 정보 수정 이력 (PAYEE_LOG)
    PAYEE_LOG: {
        BIZ_TYPE: {
            INDIVIDUAL: "개인",
            SOLE_PROPRIETOR: "개인 사업자",
            CORPORATE: "법인 사업자",
        },
        ISSUE_TYPES: {
            // DB값 : 먼데이 라벨명
            INDIVIDUAL: "개인", // (DB에 'personal'로 저장된다고 가정)
            TAX_INVOICE: "세금계산서",
            ELECTRONIC_INVOICE: "전자계산서",
            CASH_RECEIPT: "현금영수증",
        }
    }
};