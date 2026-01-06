// lib/mondayCommon.js
import {MONDAY_API_CONFIG, MONDAY_COLUMN_IDS, TABLE_NAMES_TOTAL} from "@/constants/dbConstants";
import { dbConnectTotal } from "@/lib/dbConnect";

/**
 * [Helper] 연결된 아이템 ID 조회 (미러/보드연결 모두 지원)
 */
export async function getLinkedItemId(itemId, columnId) {
    if (!itemId || !columnId) return null;

    const query = `query ($itemId: [ID!], $columnId: [String!]) {
        items (ids: $itemId) {
            column_values (ids: $columnId) {
                type
                ... on MirrorValue {
                    mirrored_items {
                        linked_item {
                            id
                        }
                    }
                }
                ... on BoardRelationValue {
                    linked_item_ids
                }
            }
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
                variables: {itemId: [parseInt(itemId)], columnId: [columnId]}
            }),
        });
        const json = await response.json();

        const colData = json.data?.items?.[0]?.column_values?.[0];
        if (!colData) return null;

        // [Case 1] Board Relation
        if (colData.linked_item_ids && colData.linked_item_ids.length > 0) {
            return colData.linked_item_ids[0];
        }

        // [Case 2] Mirror
        if (colData.mirrored_items && colData.mirrored_items.length > 0 && colData.mirrored_items[0].linked_item) {
            return colData.mirrored_items[0].linked_item.id;
        }

        return null;
    } catch (e) {
        console.error(`❌ [Linked Item Lookup Error] Item: ${itemId}, Col: ${columnId}`, e);
        return null;
    }
}

/**
 * [Helper] 먼데이 아이템의 담당자(Person/Team) 정보를 조회하여 Slack Mention Tag로 변환
 * - Total DB (sbn_total)를 사용하여 슬랙 ID 매핑
 * @param {string} itemId - 과업 정산 아이템 ID
 * @returns {Promise<string|null>} 멘션 태그 문자열 (예: "<@U123> <!subteam^G123>") 또는 null
 */
export async function getMondayAssigneeSlackTag(itemId) {
    if (!itemId) return null;

    // 과업 정산 보드의 담당자 컬럼 ID (상수 사용)
    const personColId = MONDAY_COLUMN_IDS.WORK_SETTLEMENT.PM;

    // 1. 먼데이 API로 담당자 정보 조회
    const query = `query ($itemId: [ID!], $colId: [String!]) {
        items (ids: $itemId) {
            column_values (ids: $colId) {
                value
            }
        }
    }`;

    let colValue = null;
    try {
        const response = await fetch(MONDAY_API_CONFIG.URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: MONDAY_API_CONFIG.TOKEN,
            },
            body: JSON.stringify({ query, variables: { itemId: [parseInt(itemId)], colId: [personColId] } }),
        });
        const json = await response.json();
        colValue = json.data?.items?.[0]?.column_values?.[0]?.value;
    } catch (e) {
        console.error(`❌ [Assignee Lookup Monday API Error] Item: ${itemId}`, e);
        return null;
    }

    if (!colValue) return null;

    const parsed = JSON.parse(colValue);
    const personsAndTeams = parsed.personsAndTeams || [];
    if (personsAndTeams.length === 0) return null;

    let mentionTags = [];
    let connection = null;

    try {
        // 2. Total DB 연결 (sbn_total)
        connection = await dbConnectTotal();

        for (const entity of personsAndTeams) {
            try {
                // (A) 팀(Team) -> monday_team_all 조회
                if (entity.kind === 'team') {
                    const teamSql = `
                        SELECT group_id 
                        FROM ${TABLE_NAMES_TOTAL.SBN_MONDAY_TEAM_ALL} 
                        WHERE enabled = '1' AND team_id = ? 
                        LIMIT 1
                    `;
                    const [rows] = await connection.execute(teamSql, [entity.id]);

                    if (rows.length > 0 && rows[0].group_id) {
                        mentionTags.push(`<!subteam^${rows[0].group_id}>`);
                    }
                }
                // (B) 개인(Person) -> monday_user_all + info_slack_users 조인 조회
                else if (entity.kind === 'person') {
                    const userSql = `
                        SELECT B.slack_id 
                        FROM ${TABLE_NAMES_TOTAL.SBN_MONDAY_USER_ALL} A
                        JOIN ${TABLE_NAMES_TOTAL.SBN_INFO_SLACK_USERS} B ON A.email = B.email
                        WHERE A.enabled = '1' AND A.id = ? 
                        LIMIT 1
                    `;
                    const [rows] = await connection.execute(userSql, [entity.id]);

                    if (rows.length > 0 && rows[0].slack_id) {
                        mentionTags.push(`<@${rows[0].slack_id}>`);
                    }
                }
            } catch (err) {
                console.error("Slack Mapping DB Error:", err.message);
            }
        }
    } catch (dbErr) {
        console.error("❌ [Assignee Lookup DB Connection Error]", dbErr);
    } finally {
        // 3. 연결 해제
        if (connection) connection.release();
    }

    return mentionTags.length > 0 ? mentionTags.join(" ") : null;
}

/**
 * 먼데이 아이템 ID로 실제 이름(Name)을 조회하는 함수
 * @param {number|string} itemId - 조회할 아이템 ID
 * @returns {Promise<string|null>} 아이템 이름 (실패 시 null)
 */
export async function getMondayItemName(itemId) {
    if (!itemId) return null;

    const query = `query ($itemId: [ID!]) {
        items (ids: $itemId) {
            name
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
                variables: {itemId: [parseInt(itemId)]}
            }),
        });

        const json = await response.json();

        if (json.errors) {
            console.error(`❌ [Monday Name Lookup Error] ID: ${itemId}`, json.errors);
            return null;
        }

        if (json.data && json.data.items && json.data.items.length > 0) {
            return json.data.items[0].name;
        }

        return null;
    } catch (error) {
        console.error(`❌ [Monday Name Lookup Network Error] ID: ${itemId}`, error);
        return null;
    }
}

/**
 * 먼데이닷컴 아이템 생성 함수
 * @param {number|string} boardId - 대상 보드 ID
 * @param {string} itemName - 아이템 이름 (수취인명/상호명 등)
 * @param {object} columnValues - 컬럼 값 객체 (JSON)
 * @returns {Promise<string>} 생성된 Item ID
 */
export async function createMondayItem(boardId, itemName, columnValues = {}) {
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
    const blob = new Blob([fileData], {type: 'application/octet-stream'});
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

/**
 * [추가] 먼데이닷컴 단순 컬럼 값 업데이트 함수 (상태, 텍스트 등)
 * 기존 executeMondayStatusUpdate 기능을 공용 함수로 전환
 * @param {number|string} boardId - 보드 ID
 * @param {number|string} itemId - 아이템 ID
 * @param {string} columnId - 컬럼 ID (예: status)
 * @param {string} value - 변경할 값 (라벨 텍스트 등)
 * @param {string} logPrefix - (선택) 로그 출력용 접두어
 * @returns {Promise<boolean>} 성공 여부
 */
export async function changeMondayColumnValue(boardId, itemId, columnId, value, logPrefix = "Monday Update") {
    if (!boardId || !itemId || !columnId) {
        console.error(`❌ [${logPrefix}] Invalid Parameters`);
        return false;
    }

    const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
        change_simple_column_value (board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
            id
        }
    }`;

    const variables = {
        boardId: parseInt(boardId),
        itemId: parseInt(itemId),
        columnId: columnId,
        value: value,
    };

    try {
        const response = await fetch(MONDAY_API_CONFIG.URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: MONDAY_API_CONFIG.TOKEN,
            },
            body: JSON.stringify({query, variables}),
        });

        const result = await response.json();

        if (result.errors) {
            console.error(`❌ [${logPrefix}] Update Error (Item: ${itemId}):`, result.errors);
            return false;
        } else {
            console.log(`✅ [${logPrefix}] Updated: ${itemId} -> ${value}`);
            return true;
        }
    } catch (e) {
        console.error(`❌ [${logPrefix}] API Error (Item: ${itemId}):`, e);
        return false;
    }
}