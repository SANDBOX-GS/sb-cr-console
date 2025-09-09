import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import formidable from 'formidable';
import { uploadFileToS3 } from '@/lib/s3-client'; // 1. S3 업로드 헬퍼를 import 합니다.

// formidable의 parse 메소드를 Promise 기반으로 래핑하는 함수
function parseForm(req) {
    return new Promise((resolve, reject) => {
        // formidable은 파일을 서버의 임시 폴더에 잠시 저장한 후,
        // 이 파일을 읽어 S3로 스트리밍합니다.
        const form = formidable({
            keepExtensions: true,
            filename: (name, ext, part) => {
                const originalName = part.originalFilename.split('.').slice(0, -1).join('.');
                // 공백을 언더스코어로 바꾸고 타임스탬프를 추가하여 고유한 파일 이름 생성
                return `${originalName.replace(/\s/g, '_')}-${Date.now()}${ext}`;
            }
        });

        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
}

export async function POST(req) {
    const tempFiles = []; // 처리 후 삭제할 임시 파일 목록

    try {
        // 2. formidable을 이용해 요청을 파싱하여 텍스트 데이터와 파일 정보를 분리합니다.
        const { fields, files } = await parseForm(req);

        // 3. 텍스트 데이터를 다시 자바스크립트 객체로 파싱합니다.
        const recipientInfo = JSON.parse(fields.recipientInfo[0]);
        const accountInfo = JSON.parse(fields.accountInfo[0]);
        const taxInfo = JSON.parse(fields.taxInfo[0]);

        // 4. S3에 업로드할 파일들을 Promise 배열로 만듭니다.
        const fileUploadPromises = Object.entries(files).map(async ([fieldName, fileArray]) => {
            const file = fileArray[0];
            if (file) {
                // S3에 저장될 경로와 파일 이름을 조합합니다.
                // 예: "payee_documents/businessDocument/사업자등록증-1678886400000.pdf"
                const s3Key = `payee_documents/${fieldName}/${file.newFilename}`;

                console.log(`Uploading ${fieldName}: ${s3Key} to S3...`);
                tempFiles.push(file); // 삭제를 위해 임시 파일 목록에 추가

                // S3에 파일을 업로드합니다.
                await uploadFileToS3(file, s3Key);

                // DB에 저장할 객체에 파일 키(전체 경로)를 추가합니다.
                const keyName = `${fieldName}Key`;
                if (recipientInfo.hasOwnProperty(fieldName)) {
                    recipientInfo[keyName] = s3Key;
                } else if (accountInfo.hasOwnProperty(fieldName)) {
                    accountInfo[keyName] = s3Key;
                }
            }
        });

        // 모든 파일 업로드가 완료될 때까지 기다립니다.
        await Promise.all(fileUploadPromises);

        // 5. (디버깅용) 최종 데이터를 서버 콘솔에 출력합니다.
        console.log("Final Text Data to be saved in DB:", { recipientInfo, accountInfo, taxInfo });

        // TODO:
        // 6. 파일 키가 포함된 최종 데이터를 데이터베이스에 저장하는 로직을 구현합니다.
        // 예: await db.collection('users').updateOne({ ... }, { $set: { recipientInfo, accountInfo, taxInfo } });

        return NextResponse.json({ message: '수취인 정보가 성공적으로 등록되었습니다.' }, { status: 200 });

    } catch (error) {
        console.error('Error processing request:', error);
        // TODO: S3 업로드 실패 시 이미 업로드된 파일들을 S3에서 삭제하는 롤백(rollback) 로직을 추가하는 것이 좋습니다.
        return NextResponse.json({ message: '서버 오류가 발생했습니다.', error: error.message }, { status: 500 });
    } finally {
        // 7. 성공/실패 여부와 관계없이 서버에 남은 임시 파일을 모두 삭제합니다.
        for (const file of tempFiles) {
            try {
                await fs.unlink(file.filepath);
                console.log(`Cleaned up temporary file: ${file.filepath}`);
            } catch (unlinkError) {
                console.error(`Error cleaning up temp file ${file.filepath}:`, unlinkError);
            }
        }
    }
}

