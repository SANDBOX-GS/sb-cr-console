// lib/mondayCommon.js
import {MONDAY_API_CONFIG} from "@/constants/dbConstants";

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

/**
 *  먼데이닷컴 파일 업로드 함수
 * - 엔드포인트: /v2/file 사용
 * - 방식: operations/map 제거하고 query + variables[file] 방식 사용
 */
export async function uploadFileToMonday(itemId, columnId, fileData, filename) {
    console.log(`🚀 [Monday Upload Start] Item: ${itemId}, Col: ${columnId}, File: ${filename}`);

    // 1. 엔드포인트 변경 (PHP 코드의 $apiFileUrl 참조)
    // 기존 /v2 가 아니라 /v2/file 로 보내야 단순 멀티파트 처리가 됩니다.
    const fileApiUrl = "https://api.monday.com/v2/file";

    if (!fileData) return false;

    // 2. Query 생성 (PHP 코드처럼 ID를 쿼리 문자열 안에 직접 주입)
    // $uploadFileQuery 부분과 동일하게 처리
    const query = `mutation ($file: File!) { 
        add_file_to_column (item_id: ${itemId}, column_id: "${columnId}", file: $file) { 
            id 
        } 
    }`;

    // 3. FormData 구성 (PHP의 멀티파트 바디 구성과 동일한 구조)
    const formData = new FormData();

    // (1) 쿼리 필드 추가
    formData.append("query", query);

    // (2) 파일 필드 추가 (키 이름을 'variables[file]'로 지정하는 것이 핵심)
    // PHP: name="variables[file]"; filename="..."
    const blob = new Blob([fileData], { type: 'application/octet-stream' });
    formData.append("variables[file]", blob, filename);

    try {
        const response = await fetch(fileApiUrl, {
            method: "POST",
            headers: {
                Authorization: MONDAY_API_CONFIG.TOKEN,
                // Content-Type은 fetch가 알아서 boundary 포함하여 설정함
            },
            body: formData,
            // Node.js 환경에서 FormData 전송 시 필수 (PHP cURL 동작 모방)
            duplex: 'half',
        });

        const json = await response.json();

        if (json.errors) {
            console.error(`❌ [Monday Upload Error] File: ${filename}`);
            console.error("Error Detail:", JSON.stringify(json.errors, null, 2));
            return false;
        }

        if (json.data && json.data.add_file_to_column) {
            console.log(`✅ [Monday Upload Success] File: ${filename} (Asset ID: ${json.data.add_file_to_column.id})`);
            return true;
        }

        console.error("Unknown Response:", json);
        return false;

    } catch (error) {
        console.error(`❌ [Monday Upload Network Error] File: ${filename}`, error);
        return false;
    }
}