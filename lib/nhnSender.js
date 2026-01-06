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

        if (!result.header.isSuccessful) {
            return {
                success: false,
                message: `[API Error] ${result.header.resultMessage}`
            };
        }
        return { success: true };

    } catch (e) {
        console.error("NHN Kakao Fetch Error:", e);
        return { success: false, message: `[Network Error] ${e.message}` };
    }
}