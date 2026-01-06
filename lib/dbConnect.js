import mysql from 'mysql2/promise';

// 풀(Pool) 변수는 전역으로 선언하되, 생성은 하지 않음
let pool = null;
let poolTotal = null;

/**
 * 1번 Main DB 연결 가져오기 (Lazy Initialization)
 */
export default async function dbConnect() {
    // 함수가 호출되었을 때 풀이 없으면 그때 생성함 (빌드 타임 에러 방지)
    if (!pool) {
        const MYSQL_URI = process.env.MYSQL_URI;
        if (!MYSQL_URI) {
            throw new Error('Please define the MYSQL_URI environment variable inside .env.local');
        }

        pool = mysql.createPool(MYSQL_URI);
    }
    return pool.getConnection();
}

/**
 * 2번 Total DB 연결 가져오기 (Lazy Initialization)
 */
export async function dbConnectTotal() {
    // 함수가 호출되었을 때 풀이 없으면 그때 생성함
    if (!poolTotal) {
        const MYSQL_URI_TOTAL = process.env.MYSQL_URI_TOTAL;
        if (!MYSQL_URI_TOTAL) {
            throw new Error('Please define the MYSQL_URI_TOTAL environment variable inside .env.local');
        }

        poolTotal = mysql.createPool(MYSQL_URI_TOTAL);
    }
    return poolTotal.getConnection();
}