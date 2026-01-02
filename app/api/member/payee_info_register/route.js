export const dynamic = "force-dynamic";
import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES, MONDAY_BOARD_IDS, MONDAY_COLUMN_IDS } from "@/constants/dbConstants";
import { MONDAY_LABEL } from "@/constants/mondayLabel";
import { NextResponse } from "next/server";
import { uploadFileToS3, deleteFileFromS3 } from "@/lib/s3-client";
import { createMondayItem, uploadFileToMonday } from "@/lib/mondayCommon";
import crypto from "crypto";
import { cookies } from "next/headers";
import { toYn, nullIfEmpty, calculateExpirationDate } from "@/utils/formHelpers";

const FILE_TYPE_TAG = "PAYEE_DOCUMENT";

export async function POST(req) {
    let connection;
    // 트랜잭션 실패 시 S3에 업로드된 파일의 키를 저장할 목록
    const uploadedS3Keys = [];

    try {
        const formData = await req.formData();

        const payload = {}; // 텍스트 데이터 (임시 필드 포함)
        const fileUploads = []; // 파일 데이터 목록

        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                fileUploads.push({
                    fieldName: key,
                    file: value,
                });
            } else {
                let textValue = value;
                // 'true'/'false' 문자열을 DB ENUM 타입 'Y'/'N'으로 변환
                if (textValue === "true") textValue = "Y";
                else if (textValue === "false") textValue = "N";

                payload[key] = textValue;
            }
        }

        // *******************************************************************
        // 🚨 0. 세션(쿠키)에서 실제 member_idx 가져오기
        // *******************************************************************
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        // 쿠키 값이 없거나 유효하지 않으면 접근 거부
        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                { message: "인증 정보가 없습니다. 다시 로그인해 주세요." },
                { status: 401 }
            );
        }

        // 쿠키 값은 문자열이므로 정수로 변환 (DB 저장용)
        const member_idx = parseInt(memberIdxCookie.value, 10);
        if (isNaN(member_idx) || member_idx <= 0) {
            return NextResponse.json(
                { message: "유효하지 않은 사용자 ID입니다." },
                { status: 401 }
            );
        }
        // *******************************************************************

        // *******************************************************************
        // 1. Payee Info 테이블에 저장할 최종 페이로드 준비 및 DB 저장
        // *******************************************************************

        // 필수 값 주입
        payload.member_idx = member_idx;
        payload.payout_ratio_id = DUMMY_PAYOUT_RATIO_ID;
        payload.active_status = "inactive";
        // DB 컬럼에 맞게 재구성 (dbPayload)
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

            // 개인, 사업자, 법인 필드 매핑
            user_name:
                payload.biz_type === "individual" ? payload.user_name : null,
            ssn: payload.biz_type === "individual" ? payload.ssn : null,
            identification_type:
                payload.biz_type === "individual" &&
                payload.is_minor === "N" &&
                payload.is_foreigner === "N"
                    ? payload.identification_type
                    : null,

            biz_name:
                payload.biz_type === "sole_proprietor"
                    ? payload.biz_name
                    : null,
            biz_reg_no:
                payload.biz_type === "sole_proprietor"
                    ? payload.biz_reg_no
                    : null,

            guardian_name:
                payload.is_minor === "Y" ? payload.guardian_name : null,
            guardian_tel:
                payload.is_minor === "Y" ? payload.guardian_tel : null,

            ci_cd: null,
        };

        // 2. S3 업로드 실행 (DB 트랜잭션 외부)
        const s3UploadResults = await Promise.all(
            fileUploads.map(async ({ fieldName, file }) => {
                if (file.size === 0) return null;

                const buffer = Buffer.from(await file.arrayBuffer());
                const originalName = file.name
                    .split(".")
                    .slice(0, -1)
                    .join(".");
                const extension = file.name.split(".").pop();

                const uniqueId = crypto.randomBytes(16).toString("hex");
                const s3FileName = `${uniqueId}.${extension}`;

                // S3 키 생성
                const s3Key = `cr_console/payee_documents/${fieldName}/${s3FileName}`;
                const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${s3Key}`;

                console.log(`S3: Uploading ${fieldName} to ${s3Key}...`);

                // S3 업로드 실행
                await uploadFileToS3(buffer, s3Key, file.type);

                // 업로드 성공 시 키 저장 (롤백 시 삭제를 위해)
                uploadedS3Keys.push(s3Key);

                return {
                    s3Key,
                    fileUrl,
                    file,
                    fieldName,
                    extension,
                    dbFileName: s3FileName,
                };
            })
        );

        // 3. 데이터베이스 연결 및 트랜잭션 시작
        connection = await dbConnect();
        await connection.beginTransaction();

        // 3-1. Payee Info 테이블에 기본 정보 저장
        const payeeResult = await connection.query(
            `INSERT INTO ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET ?`,
            dbPayload
        );
        const payee_idx = payeeResult[0].insertId;

        if (!payee_idx || payee_idx <= 0) {
            throw new Error(
                "수취인 정보 등록 중 참조 ID를 가져올 수 없습니다."
            );
        }
        console.log(`Payee Info saved. IDX: ${payee_idx}`);

        // 3-2. File Info 테이블에 파일 메타데이터 저장 (S3 업로드 결과를 기반으로)
        const fileInfoInsertPromises = s3UploadResults
            .filter((r) => r !== null)
            .map(async (result) => {
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

        // 모든 파일 메타데이터 DB 저장을 병렬로 실행
        await Promise.all(fileInfoInsertPromises);
        console.log("DB: All file info saved.");

        // 4. 모든 DB 작업 성공 시 커밋
        await connection.commit();
        console.log("Transaction committed successfully.");

        // 5. 성공 응답
        return NextResponse.json(
            { message: "수취인 정보 및 파일이 성공적으로 등록되었습니다." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error processing request:", error);

        // 🚨 DB 트랜잭션 실패 처리 (롤백)
        if (connection) {
            await connection.rollback();
            console.error("Transaction rolled back.");
        }

        // 🚨 S3 파일 삭제 처리 (선택 사항: 롤백되었으므로 남아있는 S3 파일 삭제 시도)
        if (uploadedS3Keys.length > 0) {
            console.warn("Attempting to clean up orphaned S3 files...");
            await Promise.all(
                uploadedS3Keys.map((key) => deleteFileFromS3(key))
            );
        }

        // 사용자에게 반환할 에러 메시지 구성
        let errorMessage = "서버 오류가 발생했습니다.";
        if (error.code) {
            errorMessage = `데이터베이스 오류가 발생했습니다: ${error.message}`;
        } else if (error.message.includes("수취인 정보 등록 중")) {
            errorMessage = error.message; // 사용자 정의 에러 메시지
        } else {
            errorMessage = `파일 처리 중 오류가 발생했습니다: ${error.message}`;
        }

        return NextResponse.json(
            { message: errorMessage, error: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
