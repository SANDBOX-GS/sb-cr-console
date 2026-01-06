import { NHN_CONFIG } from '@/constants/dbConstants';

/**
 * NHN Cloud Email 발송 공통 함수
 * @param {string} receiverEmail - 수신자 이메일
 * @param {string} receiverName - 수신자 이름
 * @param {object} templateParams - 템플릿 치환 파라미터
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function sendNHNEmail(receiverEmail, receiverName, templateParams) {
    const body = {
        templateId: templateParams.template_id ?? NHN_CONFIG.EMAIL.TEMPLATE_ID,
        templateParameter: {
            name: receiverName,
            email: receiverEmail,
            ...templateParams
        },
        receiverList: [{
            receiveMailAddr: receiverEmail,
            receiveName: receiverName,
            receiveType: "MRT0"
        }],
        userId: "CR_CONSOLE_USER"
    };

    try {
        const response = await fetch(NHN_CONFIG.EMAIL.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Secret-Key': NHN_CONFIG.EMAIL.SECRET_KEY
            },
            body: JSON.stringify(body)
        });
        const result = await response.json();

        if (!result.header.isSuccessful) {
            return {
                success: false,
                message: `[API Error] ${result.header.resultMessage} (Code: ${result.header.resultCode})`
            };
        }
        return { success: true };

    } catch (e) {
        console.error("NHN Email Fetch Error:", e);
        return {
            success: false,
            message: `[Network Error] ${e.message}`
        };
    }
}

/**
 * NHN Cloud 알림톡 발송
 */
export async function sendNHNKakao(receiverPhone, templateParams) {
    // 하이픈 제거
    const cleanPhone = receiverPhone.replace(/-/g, '');

    const body = {
        senderKey: NHN_CONFIG.KAKAO.SENDER_KEY,
        templateCode: templateParams.template_code ?? NHN_CONFIG.KAKAO.TEMPLATE_CODE,
        recipientList: [{
            recipientNo: cleanPhone,
            templateParameter: { ...templateParams }
        }]
    };

    try {
        const response = await fetch(NHN_CONFIG.KAKAO.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Secret-Key': NHN_CONFIG.KAKAO.SECRET_KEY
            },
            body: JSON.stringify(body)
        });
        const result = await response.json();

        // 1. HTTP 통신 및 API 호출 자체 성공 여부 체크
        if (!result.header.isSuccessful) {
            return {
                success: false,
                message: `[API Error] ${result.header.resultMessage} (Code: ${result.header.resultCode})`
            };
        }

        // 2. [중요] 실제 발송 요청 결과 확인 (발송 요청 실패 시 success: false 반환해야 함)
        // NHN 알림톡 API 응답 구조상, 요청이 실패하면 body가 없거나 실패 관련 정보가 담길 수 있음.
        // 보통 성공 시에는 requestId가 발급됨.
        /*
          성공 응답 예시:
          {
            "header": { "isSuccessful": true, "resultCode": 0, "resultMessage": "SUCCESS" },
            "body": {
              "data": {
                "requestId": "20240101...",
                "results": [ { "recipientNo": "...", "resultCode": 0, "resultMessage": "SUCCESS" } ]
              }
            }
          }
        */

        // body가 아예 없거나 data가 없으면 실패로 간주
        if (!result.body || !result.body.data || !result.body.data.requestId) {
            return {
                success: false,
                message: `[Request Fail] 요청이 접수되지 않았습니다.`
            };
        }

        // (더 엄격하게 하려면 results 배열 안의 resultCode까지 확인)
        const recipientResult = result.body.data.results?.[0];
        if (recipientResult && recipientResult.resultCode !== 0) {
            return {
                success: false,
                message: `[Recipient Fail] ${recipientResult.resultMessage} (Code: ${recipientResult.resultCode})`
            };
        }

        return { success: true };

    } catch (e) {
        console.error("NHN Kakao Fetch Error:", e);
        return { success: false, message: `[Network Error] ${e.message}` };
    }
}