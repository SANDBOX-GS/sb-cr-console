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
 * formidable로 받은 임시 파일을 S3에 업로드하는 함수
 * @param {object} file - formidable 파일 객체
 * @param {string} fileName - S3에 저장될 파일 이름 (Key)
 * @returns {Promise<object>} S3 업로드 결과
 */
export async function uploadFileToS3(file, fileName) {
    // 2. formidable이 임시 저장한 파일을 읽기 위한 스트림을 생성합니다.
    const fileStream = fs.createReadStream(file.filepath);

    // 3. S3에 업로드할 파일의 정보를 담은 파라미터를 준비합니다.
    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: fileStream,
        ContentType: file.mimetype, // 파일의 MIME 타입을 지정
    };

    // 4. PutObjectCommand를 생성하고 s3Client.send로 업로드를 실행합니다.
    const command = new PutObjectCommand(uploadParams);

    try {
        const data = await s3Client.send(command);
        console.log("S3 Upload Success:", data);
        return data;
    } catch (err) {
        console.error("Error uploading to S3:", err);
        throw err; // 에러를 상위로 전파하여 API 라우트에서 처리
    }
}
