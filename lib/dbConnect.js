import mysql from 'mysql2/promise';

const MYSQL_URI = process.env.MYSQL_URI;
let pool = null;

if (!MYSQL_URI) {
    throw new Error('Please define the MYSQL_URI environment variable inside .env.local');
}

// 연결 풀은 한 번만 생성합니다.
if (!pool) {
    pool = mysql.createPool(MYSQL_URI);
}

export default async function dbConnect() {
    // pool에서 연결을 빌려옵니다.
    return pool.getConnection();
}