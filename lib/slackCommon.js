// lib/slackCommon.js
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL_ID = 'C022X676VBR';

/**
 * 슬랙 알림 전송 공용 함수 (순수 전송 기능)
 * * @param {Object} params - 파라미터 객체
 * @param {string} params.channelId - 전송할 채널 ID (필수)
 * @param {string} params.mentionTarget - 멘션할 대상 문자열 (예: "<@U1234>", "<!subteam^G1234>", 없으면 null)
 * @param {string} params.title - 알림 제목 (예: "📧 이메일 발송 실패")
 * @param {string} params.message - 메인 메시지 내용
 * @param {Array} params.fields - 상세 정보 배열 [{ title: "제목", value: "내용" }]
 * @param {string} params.buttonText - 버튼 텍스트 (옵션)
 * @param {string} params.buttonUrl - 버튼 링크 URL (옵션)
 */
export async function sendSlack({
                                    channelId = SLACK_CHANNEL_ID,
                                    mentionTarget = null,
                                    title,
                                    message,
                                    fields = [],
                                    buttonText = null,
                                    buttonUrl = null
                                }) {
    if (!SLACK_TOKEN || !channelId) {
        console.error("❌ [Slack] Token or Channel ID missing");
        return;
    }

    try {
        // 1. 멘션 처리 (멘션 대상이 없으면 '담당자' 등의 텍스트로 대체하거나 비움)
        const mentionText = mentionTarget ? `${mentionTarget} 님,` : "";

        // 2. 상세 필드 블록 구성
        const fieldBlocks = fields.map(f => ({
            type: "mrkdwn",
            text: `*${f.title}:*\n${f.value}`
        }));

        // 3. 메시지 페이로드 구성
        const payload = {
            channel: channelId,
            text: `${title} 알림`, // 모바일 알림용 텍스트
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `${mentionText} ${message}`
                    }
                },
                {
                    type: "section",
                    fields: fieldBlocks
                }
            ]
        };

        // 4. 버튼이 있는 경우 추가
        if (buttonText && buttonUrl) {
            payload.blocks.push({
                type: "actions",
                elements: [
                    {
                        type: "button",
                        text: { type: "plain_text", text: buttonText },
                        url: buttonUrl,
                        style: "danger" // 빨간색 버튼 (경고/실패 느낌)
                    }
                ]
            });
        }

        // 5. 전송
        const response = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SLACK_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!data.ok) {
            throw new Error(`Slack API Error: ${data.error}`);
        }

        console.log(`🔔 [Slack] Sent: ${title}`);

    } catch (error) {
        console.error(`❌ [Slack] Send Failed: ${error.message}`);
    }
}