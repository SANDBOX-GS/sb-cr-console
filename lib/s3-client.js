import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

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
 * [내부 함수] ReadableStream을 Buffer로 변환
 */
const streamToBuffer = async (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
};

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

/**
 * S3에서 특정 객체 키(Key)에 해당하는 파일을 삭제하는 함수
 * @param {string} key - S3 객체 키 (삭제할 파일의 전체 경로)
 */
export async function deleteFileFromS3(key) {
    if (!key) {
        console.warn("[S3 Delete] Skipping delete: Key is null or empty.");
        return;
    }

    const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);

    try {
        await s3Client.send(command);
        console.log(`[S3 Delete] File deleted successfully: ${key}`);
    } catch (err) {
        console.error(`[S3 Delete Error] Failed to delete file ${key}:`, err);
        // S3 삭제가 실패하더라도 주 트랜잭션 에러를 가리지 않도록, 필요하다면 여기서 에러를 throw하지 않을 수도 있습니다.
        // 현재는 명시적인 에러 처리를 위해 throw합니다.
        throw err;
    }
}

/**
 * ★ [추가됨] S3에서 파일 키(Key)로 파일을 다운로드하여 Buffer로 반환하는 함수
 * @param {string} key - S3 객체 키
 * @returns {Promise<Buffer>} 파일 데이터 버퍼
 */
export async function getFileBufferFromS3(key) {
    if (!key) return null;

    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
    });

    try {
        const response = await s3Client.send(command);
        // S3 스트림을 버퍼로 변환하여 리턴
        return await streamToBuffer(response.Body);
    } catch (err) {
        console.error(`[S3 Download Error] Key: ${key}`, err);
        return null; // 파일이 없거나 에러 발생 시 null 리턴
    }
}