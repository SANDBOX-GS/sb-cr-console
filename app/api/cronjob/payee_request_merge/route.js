export const dynamic = 'force-dynamic';
import dbConnect from '@/lib/dbConnect';
import {
    TABLE_NAMES,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS,
    MONDAY_API_CONFIG  // [추가] API 설정 import
} from '@/constants/dbConstants';

/**
 * 먼데이닷컴 아이템 생성 함수
 */
async function createMondayItem(itemName, columnValues) {
    const query = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
      id
    }
  }`;

    const variables = {
        boardId: parseInt(MONDAY_BOARD_IDS.PAYEE_REQUEST),
        itemName: itemName,
        columnValues: JSON.stringify(columnValues)
    };

    // [수정] 상수로 정의된 URL과 토큰 사용
    const response = await fetch(MONDAY_API_CONFIG.URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': MONDAY_API_CONFIG.TOKEN
        },
        body: JSON.stringify({ query, variables })
    });

    const responseData = await response.json();

    if (responseData.errors) {
        throw new Error(JSON.stringify(responseData.errors));
    }

    return responseData.data.create_item.id;
}

export async function POST(request) {
    let connection;

    try {
        connection = await dbConnect();

        // 1. 미처리 로그 조회 (is_use = 'N')
        const [logs] = await connection.execute(
            `SELECT * FROM ${TABLE_NAMES.SBN_PAYEE_REQUEST_LOG} WHERE is_use = 'N'`
        );

        if (logs.length === 0) {
            return new Response(JSON.stringify({ message: '처리할 데이터가 없습니다.' }), { status: 200 });
        }

        // 2. 데이터 그룹화 로직
        const groups = {};

        logs.forEach(log => {
            const email = log.email;
            const tel = log.tel && log.tel.trim() !== '' ? log.tel.trim() : null;

            if (!groups[email]) {
                groups[email] = { valid: {}, nulls: [] };
            }

            if (tel) {
                if (!groups[email].valid[tel]) {
                    groups[email].valid[tel] = [];
                }
                groups[email].valid[tel].push(log);
            } else {
                groups[email].nulls.push(log);
            }
        });

        const finalRequests = [];

        Object.keys(groups).forEach(email => {
            const { valid, nulls } = groups[email];
            const validTels = Object.keys(valid);

            if (validTels.length > 0) {
                const firstTel = validTels[0];
                valid[firstTel].push(...nulls);

                validTels.forEach(tel => {
                    finalRequests.push({ email, tel, logs: valid[tel] });
                });
            } else {
                if (nulls.length > 0) {
                    finalRequests.push({ email, tel: null, logs: nulls });
                }
            }
        });

        // 3. 그룹별 먼데이 생성 및 DB 저장
        let processedCount = 0;
        const C_IDS = MONDAY_COLUMN_IDS.PAYEE_REQUEST;

        for (const req of finalRequests) {
            const { email, tel, logs } = req;

            const crIdsRaw = logs.map(l => l.board_relation_mkxsn9r6).filter(val => val);
            const crIdsSet = new Set();
            crIdsRaw.forEach(val => val.split(',').forEach(id => crIdsSet.add(id.trim())));
            const crIdsString = Array.from(crIdsSet).join(',');

            const taskIds = logs.map(l => l.item_id);
            const taskIdsString = taskIds.join(',');

            const emailState = 'pending';
            const kakaoState = tel ? 'pending' : 'none';

            try {
                // 먼데이 전송용 데이터 (정수 배열 변환)
                const mondayConnectCrIds = Array.from(crIdsSet).map(id => parseInt(id)).filter(id => !isNaN(id));
                const mondayConnectTaskIds = taskIds.map(id => parseInt(id)).filter(id => !isNaN(id));

                const mondayColumnValues = {
                    [C_IDS.EMAIL]: { "email": email, "text": email },
                    [C_IDS.STATUS]: { "label": "발송 요청" },
                };

                if (tel) {
                    mondayColumnValues[C_IDS.PHONE] = { "phone": tel, "countryShortName": "KR" };
                }

                if (mondayConnectCrIds.length > 0) {
                    mondayColumnValues[C_IDS.LINK_CR_INVENTORY] = { "item_ids": mondayConnectCrIds };
                }

                if (mondayConnectTaskIds.length > 0) {
                    mondayColumnValues[C_IDS.LINK_TASK_SETTLEMENT] = { "item_ids": mondayConnectTaskIds };
                }

                // 먼데이 아이템 생성
                const mondayItemId = await createMondayItem(`${email} 요청건`, mondayColumnValues);
                console.log(`✅ Monday Item Created: ${mondayItemId} (${email})`);

                // DB Insert
                await connection.execute(
                    `INSERT INTO ${TABLE_NAMES.SBN_PAYEE_REQUEST} 
                    (item_id, board_relation_mkxsn9r6, board_relation_mkxsa8rp, email, tel, email_state, kakao_state) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        mondayItemId,
                        crIdsString,
                        taskIdsString,
                        email,
                        tel,
                        emailState,
                        kakaoState
                    ]
                );

                // Log Update
                const logIdxs = logs.map(l => l.idx).join(',');
                if (logIdxs.length > 0) {
                    await connection.execute(
                        `UPDATE ${TABLE_NAMES.SBN_PAYEE_REQUEST_LOG} SET is_use = 'Y' WHERE idx IN (${logIdxs})`
                    );
                }

                processedCount++;

            } catch (err) {
                console.error(`❌ [Error Processing Group] Email: ${email}`, err);
                continue;
            }
        }

        return new Response(JSON.stringify({
            message: 'Cron Job Completed',
            processed_groups: processedCount,
            total_logs: logs.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Server Error:', error);
        return new Response(JSON.stringify({ message: 'Server Error', error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}