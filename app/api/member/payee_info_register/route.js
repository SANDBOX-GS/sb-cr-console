import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
import { NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/lib/s3-client';

export async function POST(req) {
    try {
        // 1. Next.js의 내장 메서드로 FormData를 파싱합니다. formidable이 더 이상 필요 없습니다.
        const formData = await req.formData();

        // 2. FormData에서 텍스트 데이터와 파일 데이터를 분리하여 처리합니다.
        const textFields = {};
        const fileUploads = [];

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                // 값이 파일 객체인 경우
                fileUploads.push({
                    fieldName: key,
                    file: value,
                });
            } else {
                // 값이 텍스트인 경우
                textFields[key] = value;
            }
        }

        // 3. 텍스트 데이터를 다시 자바스크립트 객체 구조로 만듭니다.
        const recipientInfo = JSON.parse(textFields['recipientInfo']);
        const accountInfo = JSON.parse(textFields['accountInfo']);
        const taxInfo = JSON.parse(textFields['taxInfo']);

        // 4. S3에 파일들을 병렬로 업로드합니다.
        const fileUploadPromises = fileUploads.map(async ({ fieldName, file }) => {
            // 파일을 ArrayBuffer로 읽은 뒤, Buffer로 변환합니다.
            const buffer = Buffer.from(await file.arrayBuffer());

            // 고유한 파일 이름 생성 (폴더 구조 포함)
            const originalName = file.name.split('.').slice(0, -1).join('.');
            const extension = file.name.split('.').pop();
            const s3Key = `payee_documents/${fieldName}/${originalName.replace(/\s/g, '_')}-${Date.now()}.${extension}`;

            console.log(`Uploading ${fieldName}: ${s3Key} to S3...`);

            // 수정된 S3 업로드 함수 호출
            await uploadFileToS3(buffer, s3Key, file.type);

            // DB에 저장할 객체에 S3 파일 키(전체 경로)를 추가합니다.
            const keyName = `${fieldName}Key`;
            // hasOwnProperty는 객체에 직접 속성이 있는지 확인하는 더 안전한 방법입니다.
            if (Object.prototype.hasOwnProperty.call(recipientInfo, fieldName)) {
                recipientInfo[keyName] = s3Key;
            } else if (Object.prototype.hasOwnProperty.call(accountInfo, fieldName)) {
                accountInfo[keyName] = s3Key;
            }
        });

        await Promise.all(fileUploadPromises);

        console.log("Final Text Data to be saved in DB:", { recipientInfo, accountInfo, taxInfo });

        // TODO: 데이터베이스에 최종 데이터를 저장하는 로직을 구현합니다.

        return NextResponse.json({ message: '수취인 정보가 성공적으로 등록되었습니다.' }, { status: 200 });

    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ message: '서버 오류가 발생했습니다.', error: error.message }, { status: 500 });
    }
}

