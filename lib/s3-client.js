import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// 1. .env.local 파일에서 환경 변수를 가져와 S3 클라이언트를 생성합니다.
const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true, // 네이버 클라우드 등 일부 S3 호환 스토리지에 필요
});

/**
 * 파일 버퍼(Buffer)를 S3에 업로드하는 함수
 * @param {Buffer} buffer - 파일의 바이너리 데이터
 * @param {string} fileName - S3에 저장될 파일 이름 (Key)
 * @param {string} mimetype - 파일의 MIME 타입
 * @returns {Promise<object>} S3 업로드 결과
 */
export async function uploadFileToS3(buffer, fileName, mimetype) {
    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: buffer, // ✅ 수정: 파일 경로 대신 파일 데이터(버퍼)를 직접 전달
        ContentType: mimetype,
    };

    const command = new PutObjectCommand(uploadParams);

    try {
        const data = await s3Client.send(command);
        console.log("S3 Upload Success:", data);
        return data;
    } catch (err) {
        console.error("Error uploading to S3:", err);
        throw err;
    }
}

