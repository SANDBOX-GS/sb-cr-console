// lib/mondayCommon.js
import { MONDAY_API_CONFIG } from "@/constants/dbConstants";

/**
 * 먼데이닷컴 아이템 생성 함수
 * @param {number|string} boardId - 대상 보드 ID
 * @param {string} itemName - 아이템 이름 (수취인명/상호명 등)
 * @param {object} columnValues - 컬럼 값 객체 (JSON)
 * @returns {Promise<string>} 생성된 Item ID
 */
export async function createMondayLogItem(boardId, itemName, columnValues = {}) {
    const query = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
      id
    }
  }`;

    try {
        const response = await fetch(MONDAY_API_CONFIG.URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: MONDAY_API_CONFIG.TOKEN,
            },
            body: JSON.stringify({
                query,
                variables: {
                    boardId: parseInt(boardId),
                    itemName: itemName,
                    columnValues: JSON.stringify(columnValues),
                },
            }),
        });

        const json = await response.json();

        if (json.errors) {
            console.error("Monday API Error:", JSON.stringify(json.errors));
            throw new Error("먼데이 아이템 생성 실패");
        }

        if (!json.data || !json.data.create_item) {
            throw new Error("먼데이 아이템 생성 응답 오류");
        }

        return json.data.create_item.id;
    } catch (error) {
        console.error("Monday Fetch Error:", error);
        throw error;
    }
}