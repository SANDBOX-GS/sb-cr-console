import dbConnect from '@/lib/dbConnect';
import { TABLE_NAMES } from '@/constants/dbConstants';
import { NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/lib/s3-client';

export async function POST(req) {
    let connection;

    try {
        const formData = await req.formData();

        const payload = {}; // 최종 DB 저장을 위한 통합 객체
        const fileUploads = [];

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                // 파일 객체인 경우, 업로드 대상 목록에 추가
                fileUploads.push({
                    fieldName: key,
                    file: value,
                });
            } else {
                // 텍스트 데이터 처리 (문자열로 온 불리언 값 변환 포함)
                let textValue = value;
                if (textValue === 'true') textValue = true;
                else if (textValue === 'false') textValue = false;

                payload[key] = textValue;
            }
        }

        // 1. 파일들을 S3에 병렬로 업로드하고, 그 결과를 payload에 추가합니다.
        const fileUploadPromises = fileUploads.map(async ({ fieldName, file }) => {
            if (file.size === 0) return; // 빈 파일은 업로드 건너뛰기

            const buffer = Buffer.from(await file.arrayBuffer());

            // 고유한 파일 이름 생성
            const originalName = file.name.split('.').slice(0, -1).join('.');
            const extension = file.name.split('.').pop();
            // user_id 등을 포함하여 폴더 구조를 만드는 것이 좋습니다. (예: payee_documents/{member_idx}/...)
            const s3Key = `payee_documents/${fieldName}/${originalName.replace(/\s/g, '_')}-${Date.now()}.${extension}`;

            console.log(`Uploading ${fieldName}: ${s3Key} to S3...`);

            await uploadFileToS3(buffer, s3Key, file.type);

            // DB에 저장할 객체에 S3 파일 키 (DB 컬럼명 규칙에 맞춰 {필드명}_key 추가)
            const dbKeyName = `${fieldName}_key`;
            payload[dbKeyName] = s3Key;
        });

        await Promise.all(fileUploadPromises);

        // 2. TODO: 데이터베이스에 최종 데이터를 저장하는 로직을 구현합니다.

        // 임시 상수 (실제 환경에서는 인증 시스템에서 가져와야 함)
        const DUMMY_MEMBER_IDX = 123;
        const DUMMY_PAYOUT_RATIO_ID = 'DEFAULT_RATIO';
        const DUMMY_ACTIVE_STATUS = 'active';

        // 필수 값 주입 (실제로는 세션/토큰에서 member_idx를 가져와야 합니다.)
        payload.member_idx = DUMMY_MEMBER_IDX;
        payload.payout_ratio_id = DUMMY_PAYOUT_RATIO_ID;
        payload.active_status = DUMMY_ACTIVE_STATUS;

        // user_type 설정 (biz_type 기반)
        if (payload.biz_type === 'corporate_business') {
            payload.user_type = '법인';
        } else {
            payload.user_type = '개인';
        }

        // 프론트엔드에서 분리된 개인/사업자 정보 정리 및 매핑
        // DB 스키마에 맞지 않는 임시 필드 제거 및 매핑

        const dbPayload = {
            member_idx: payload.member_idx,
            payout_ratio_id: payload.payout_ratio_id,
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
            user_name: payload.biz_type === 'individual' ? payload.real_name : null,
            ssn: payload.biz_type === 'individual'
                ? (payload.is_foreigner === 'Y' ? payload.foreigner_registration_number : payload.id_number)
                : null,
            identification_type: payload.biz_type === 'individual' && payload.is_minor === 'N' && payload.is_foreigner === 'N' ? payload.id_document_type : null,

            biz_name: payload.biz_type === 'sole_proprietor' ? payload.business_name : null,
            biz_reg_no: payload.biz_type === 'sole_proprietor' ? payload.business_number : null,

            corp_name: payload.biz_type === 'corporate_business' ? payload.business_name : null,
            corp_reg_no: payload.biz_type === 'corporate_business' ? payload.business_number : null,

            guardian_name: payload.is_minor === 'Y' ? payload.guardian_name : null,
            guardian_tel: payload.is_minor === 'Y' ? payload.guardian_phone : null,

            // **********************************************
            // 파일 관련 필드 키는 S3 업로드 시 여기에 추가되어야 합니다.
            // 예: business_document_key: "..."
            // **********************************************

            // ci_cd는 현재 데이터에 없으므로 null 처리
            ci_cd: null,
        };

        console.log("Final Data Payload to be saved in DB:", payload);

        // 3. 데이터베이스 연결 및 저장
        connection = await dbConnect();

        // MySQL 쿼리 실행
        const result = await connection.query(
            `INSERT INTO ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET ?`,
            dbPayload
        );

        console.log('Database Insert Result:', result);

        return NextResponse.json({ message: '수취인 정보가 성공적으로 등록되었습니다.' }, { status: 200 });

    } catch (error) {
        console.error('Error processing request:', error);

        // 데이터베이스 쿼리 오류일 경우 메시지 처리
        let errorMessage = '서버 오류가 발생했습니다.';
        if (error.code) {
            // MySQL 에러 코드 등 추가 정보 표시
            errorMessage = `데이터베이스 오류가 발생했습니다: ${error.message}`;
        }

        return NextResponse.json({ message: errorMessage, error: error.message }, { status: 500 });
    } finally {
        // 4. 데이터베이스 연결 종료 (만약 dbConnect가 Connection Pool을 사용한다면 release)
        if (connection) {
            connection.release();
        }
    }
}

