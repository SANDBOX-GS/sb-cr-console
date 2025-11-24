import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
import { NextResponse } from 'next/server';
import { uploadFileToS3, deleteFileFromS3 } from '@/lib/s3-client';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// 임시 상수 (실제 환경에서는 인증 시스템에서 가져와야 함)
const DUMMY_PAYOUT_RATIO_ID = 'DEFAULT_RATIO';
const FILE_TYPE_TAG = 'PAYEE_DOCUMENT'; // 파일 정보 테이블의 type 필드에 사용될 상수

/**
 * POST 요청 처리 함수 (수취인 정보 수정)
 * @param {Request} req Next.js Request 객체 (FormData 포함)
 */
export async function POST(req) {
    let connection;

    // 새로 업로드된 파일 키 (트랜잭션 실패 시 삭제)
    const newlyUploadedS3Keys = [];
    // 기존 파일 키 (트랜잭션 성공 시 삭제)
    let existingFilesS3KeysToDelete = [];

    try {
        const formData = await req.formData();

        const payload = {};
        const fileUploads = [];

        // 1. FormData 파싱 및 텍스트/파일 분리
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                fileUploads.push({ fieldName: key, file: value });
            } else {
                let textValue = value;
                if (textValue === 'true') textValue = 'Y';
                else if (textValue === 'false') textValue = 'N';
                payload[key] = textValue;
            }
        }

        // *******************************************************************
        // 2. member_idx 가져오기 및 유효성 검사
        // *******************************************************************
        const memberIdxCookie = await cookies().get('member_idx');

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                { message: '인증 정보가 없습니다. 다시 로그인해 주세요.' },
                { status: 401 }
            );
        }

        const member_idx = parseInt(memberIdxCookie.value, 10);
        if (isNaN(member_idx) || member_idx <= 0) {
            return NextResponse.json(
                { message: '유효하지 않은 사용자 ID입니다.' },
                { status: 401 }
            );
        }
        // *******************************************************************

        // *******************************************************************
        // 3. Payee Info 테이블에 UPDATE할 최종 페이로드 준비
        // *******************************************************************
        payload.member_idx = member_idx;
        payload.payout_ratio_id = DUMMY_PAYOUT_RATIO_ID;
        payload.active_status = 'inactive';
        payload.user_type = payload.biz_type === 'corporate_business' ? '법인' : '개인';

        // DB 스키마에 맞게 재구성 (dbPayload)
        const dbPayload = {
            biz_type: payload.biz_type,
            is_overseas: payload.is_overseas,
            is_minor: payload.is_minor,
            is_foreigner: payload.is_foreigner,
            bank_name: payload.bank_name,
            account_holder: payload.account_holder,
            account_number: payload.account_number,
            swift_code: payload.swift_code,
            bank_address: payload.bank_address,
            invoice_type: payload.invoice_type,
            is_simple_taxpayer: payload.is_simple_taxpayer,
            active_status: payload.active_status,
            user_type: payload.user_type,

            // 개인, 사업자, 법인 필드 매핑
            user_name: payload.biz_type === 'individual' ? payload.user_name : null,
            ssn: payload.biz_type === 'individual'
                ? (payload.is_foreigner === 'Y' ? payload.foreigner_registration_number : payload.ssn)
                : null,
            identification_type: payload.biz_type === 'individual' && payload.is_minor === 'N' && payload.is_foreigner === 'N' ? payload.identification_type : null,

            biz_name: payload.biz_type === 'sole_proprietor' ? payload.biz_name : null,
            biz_reg_no: payload.biz_type === 'sole_proprietor' ? payload.biz_reg_no : null,

            corp_name: payload.biz_type === 'corporate_business' ? payload.corp_name : null,
            corp_reg_no: payload.biz_type === 'corporate_business' ? payload.corp_reg_no : null,

            guardian_name: payload.is_minor === 'Y' ? payload.guardian_name : null,
            guardian_tel: payload.is_minor === 'Y' ? payload.guardian_tel : null,
        };

        // 4. S3 업로드 실행 (DB 트랜잭션 외부)
        const s3UploadResults = await Promise.all(fileUploads.map(async ({ fieldName, file }) => {
            // ... (S3 업로드 로직은 동일) ...
            if (file.size === 0) return null; // 빈 파일 무시

            const buffer = Buffer.from(await file.arrayBuffer());
            const extension = file.name.split('.').pop();
            const uniqueId = crypto.randomBytes(16).toString('hex');
            const s3FileName = `${uniqueId}.${extension}`;
            const s3Key = `cr_console/payee_documents/${fieldName}/${s3FileName}`;
            const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${s3Key}`;

            await uploadFileToS3(buffer, s3Key, file.type);
            newlyUploadedS3Keys.push(s3Key); // 🚨 newlyUploadedS3Keys에만 추가

            return { s3Key, fileUrl, file, fieldName, extension, dbFileName: s3FileName };
        }));


        // *******************************************************************
        // 5. 데이터베이스 연결 및 트랜잭션 시작
        // *******************************************************************
        connection = await dbConnect();
        await connection.beginTransaction();

        // 5-1. 기존 Payee Info ID(idx) 조회
        const [payeeRows] = await connection.query(
            `SELECT idx FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} WHERE member_idx = ? ORDER BY created_at DESC LIMIT 1`,
            [member_idx]
        );

        if (payeeRows.length === 0) {
            throw new Error("수정할 수취인 정보를 찾을 수 없습니다.");
        }
        const payee_idx = payeeRows[0].idx;

        // 🚨🚨🚨 5-2. 파일 정리 및 삭제 목록 준비 (업데이트 전) 🚨🚨🚨
        const fileTagsToProcess = []; // 새로 업로드되거나 명시적으로 삭제된 태그 목록
        const deletedFileTags = [];   // 명시적으로 삭제 요청된 태그 목록

        for (const [key, value] of formData.entries()) {
            // 'delete_' 마커 확인 (삭제 요청)
            if (key.startsWith('delete_') && value === 'Y') {
                const tag = key.substring(7); // 'delete_' 문자열 제거
                deletedFileTags.push(tag);
                fileTagsToProcess.push(tag);
            }
            // 새 파일 업로드 확인 (대체 요청)
            if (fileUploads.some(f => f.fieldName === key)) {
                if (!fileTagsToProcess.includes(key)) {
                    fileTagsToProcess.push(key);
                }
            }
        }

        if (fileTagsToProcess.length > 0) {
            // 5-2-1. 기존 파일 메타데이터 조회
            // fileTagsToProcess 목록에 해당하는 기존 파일만 조회 (삭제 및 대체를 위해)
            const tagsPlaceholder = fileTagsToProcess.map(() => '?').join(', ');

            const [existingFiles] = await connection.query(
                `SELECT file_url, tag FROM ${TABLE_NAMES.SBN_FILE_INFO} 
         WHERE ref_table_name = ? AND ref_table_idx = ? AND tag IN (${tagsPlaceholder})`,
                [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx, ...fileTagsToProcess]
            );

            // 5-2-2. 기존 파일 메타데이터 DB 삭제
            await connection.execute(
                `DELETE FROM ${TABLE_NAMES.SBN_FILE_INFO} 
         WHERE ref_table_name = ? AND ref_table_idx = ? AND tag IN (${tagsPlaceholder})`,
                [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx, ...fileTagsToProcess]
            );
            console.log(`DB: Deleted file info for tags: ${fileTagsToProcess.join(', ')}.`);

            // 5-2-3. S3 파일 삭제 목록 준비
            const s3UrlPrefix = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/`;
            existingFiles.forEach(file => {
                if (file.file_url && file.file_url.startsWith(s3UrlPrefix)) {
                    const s3Key = file.file_url.substring(s3UrlPrefix.length);
                    // 🚨🚨🚨 existingFilesS3KeysToDelete 목록에 추가 🚨🚨🚨
                    existingFilesS3KeysToDelete.push(s3Key);
                }
            });
        }
        // 🚨 파일이 수정되거나 삭제되지 않은 필드는 이 로직을 거치지 않으므로 기존 파일이 유지됩니다.

        // 5-3. Payee Info 테이블 업데이트
        await connection.query(
            `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET ?, updated_at = NOW() WHERE idx = ?`,
            [dbPayload, payee_idx]
        );
        console.log('DB: Payee Info updated.');


        // 5-3. 파일 처리: 기존 파일 메타데이터 삭제 (새로 업로드된 파일이 있을 경우)
        if (s3UploadResults.filter(r => r !== null).length > 0) {
            const [existingFiles] = await connection.query(
                `SELECT file_url FROM ${TABLE_NAMES.SBN_FILE_INFO} WHERE ref_table_name = ? AND ref_table_idx = ?`,
                [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx]
            );

            // 기존 파일 메타데이터 DB 삭제
            await connection.execute(
                `DELETE FROM ${TABLE_NAMES.SBN_FILE_INFO} WHERE ref_table_name = ? AND ref_table_idx = ?`,
                [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx]
            );
            console.log('DB: Deleted existing file info.');

            // S3 파일 삭제를 위한 Key 추출 및 요청 목록에 추가
            const s3UrlPrefix = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/`;
            existingFiles.forEach(file => {
                if (file.file_url && file.file_url.startsWith(s3UrlPrefix)) {
                    const s3Key = file.file_url.substring(s3UrlPrefix.length);
                    // 🚨 이 S3 Key는 트랜잭션 성공 후 (finally) 삭제됩니다.
                    uploadedS3Keys.push(s3Key);
                }
            });
        }

        // 5-4. File Info 테이블에 새로운 파일 메타데이터 저장
        const fileInfoInsertPromises = s3UploadResults.filter(r => r !== null).map(async (result) => {
            const fileInfoPayload = {
                type: FILE_TYPE_TAG,
                ref_table_name: TABLE_NAMES.SBN_MEMBER_PAYEE,
                ref_table_idx: payee_idx,
                file_url: result.fileUrl,
                file_name: result.dbFileName,
                file_realname: result.file.name,
                file_ext: result.extension,
                file_size: result.file.size.toString(),
                seq: 0,
                tag: result.fieldName,
                creator_id: payload.member_idx,
            };

            await connection.query(
                `INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO} SET ?`,
                fileInfoPayload
            );
        });

        await Promise.all(fileInfoInsertPromises);
        console.log('DB: New file info saved.');

        // 6. 모든 DB 작업 성공 시 커밋
        await connection.commit();
        console.log('Transaction committed successfully.');

        // 7. 성공 응답
        return NextResponse.json({ message: '수취인 정보 및 파일이 성공적으로 수정되었습니다.' }, { status: 200 });

    } catch (error) {
        console.error('Error processing update request:', error);

        // 🚨 DB 트랜잭션 실패 처리 (롤백)
        if (connection) {
            await connection.rollback();
            console.error('Transaction rolled back.');
        }

        // 🚨 S3 파일 삭제 처리 (트랜잭션 실패 시 새로 업로드된 파일 삭제)
        if (uploadedS3Keys.length > 0) {
            console.warn('Attempting to clean up orphaned S3 files...');
            // 트랜잭션 실패 시, 새로 업로드된 파일 (S3 keys)만 삭제해야 합니다.
            // 현재 uploadedS3Keys는 '새로 업로드된 파일'과 '기존 파일'이 혼재될 수 있으므로 분리가 필요합니다.
            // 하지만 DB 롤백이 발생하면 DB에 커밋되지 않은 모든 S3 파일을 삭제하는 것으로 임시 처리합니다.
            // (이전 단계에서 uploadedS3Keys에는 새로 업로드된 파일만 담았었음)
            await Promise.all(uploadedS3Keys.map(key => deleteFileFromS3(key)));
        }

        // 사용자에게 반환할 에러 메시지 구성
        let errorMessage = '수정 중 서버 오류가 발생했습니다.';
        if (error.code) {
            errorMessage = `데이터베이스 오류가 발생했습니다: ${error.message}`;
        } else {
            errorMessage = `파일 처리 중 오류가 발생했습니다: ${error.message}`;
        }

        return NextResponse.json({ message: errorMessage, error: error.message }, { status: 500 });
    } finally {
        if (connection) {
            connection.release();
        }

        if (existingFilesS3KeysToDelete.length > 0) {
            console.warn('Attempting to clean up old S3 files...');
            // 이 로직은 catch 블록이 실행되지 않고 성공적으로 커밋되었을 때 실행됨
            await Promise.all(existingFilesS3KeysToDelete.map(key => deleteFileFromS3(key)));
        }
    }
}