export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import {
    TABLE_NAMES,
    MONDAY_BOARD_IDS,
    MONDAY_COLUMN_IDS,
} from "@/constants/dbConstants";
import { MONDAY_LABEL } from "@/constants/mondayLabel";
import { NextResponse } from "next/server";
import {
    uploadFileToS3,
    deleteFileFromS3,
    getFileBufferFromS3,
} from "@/lib/s3-client";
import { createMondayItem, uploadFileToMonday } from "@/lib/mondayCommon";
import { sendSlack } from "@/lib/slackCommon";
import crypto from "crypto";
import { cookies } from "next/headers";
import {
    toYn,
    nullIfEmpty,
    calculateExpirationDate,
} from "@/utils/formHelpers";

const FILE_TYPE_TAG = "PAYEE_DOCUMENT";

const isBizType = (bizType) =>
    [
        "sole_proprietor",
        "corporate_business",
        "simple_taxpayer",
        "tax_free_business",
    ].includes(bizType);
const isIndividual = (bizType) => bizType === "individual";

// URL에서 S3 Key 추출 헬퍼 (DB URL 구조에 따라 수정 필요)
// 예: https://endpoint/bucket/cr_console/... -> cr_console/...
const getKeyFromDbUrl = (fullUrl) => {
    if (!fullUrl) return null;
    const bucketName = process.env.S3_BUCKET_NAME; // "sandboxnetwork-public-hosting"
    const splitStr = `/${bucketName}/`;

    const parts = fullUrl.split(splitStr);
    if (parts.length > 1) {
        // decodeURIComponent는 URL에 한글 등이 포함되었을 경우를 대비
        return decodeURIComponent(parts[1]);
    }
    return null;
};

export async function POST(req) {
    let connection;
    const newlyUploadedS3Keys = [];

    try {
        const formData = await req.formData();
        const payload = {};
        const fileUploads = [];

        // 1. FormData 파싱
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                if (value.size > 0)
                    fileUploads.push({ fieldName: key, file: value });
            } else {
                payload[key] = value;
            }
        }

        // 2. 사용자 인증 (쿠키)
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                { message: "인증 정보가 없습니다." },
                { status: 401 }
            );
        }
        const member_idx = parseInt(memberIdxCookie.value, 10);

        // 3. DB Insert/Update용 Payload 구성
        const biz_type = payload.biz_type;
        const is_overseas = toYn(payload.is_overseas) || "N";
        const is_minor = toYn(payload.is_minor) || "N";
        const is_foreigner = toYn(payload.is_foreigner) || "N";
        const calculatedExpiredAt = calculateExpirationDate(
            payload.consent_type
        );

        const baseUserPayload = {
            tel: nullIfEmpty(payload.tel),
        };

        const baseDbPayload = {
            biz_type: nullIfEmpty(biz_type),
            invoice_type: nullIfEmpty(payload.invoice_type),
            user_name: nullIfEmpty(payload.user_name),
            tax: nullIfEmpty(payload.tax),
            is_overseas: is_overseas,
            is_minor: is_minor,
            is_foreigner: is_foreigner,
            bank_name: nullIfEmpty(payload.bank_name),
            account_holder: nullIfEmpty(payload.account_holder),
            account_number: nullIfEmpty(payload.account_number),
            swift_code: nullIfEmpty(payload.swift_code),
            bank_address: nullIfEmpty(payload.bank_address),
            agree_expired_at: calculatedExpiredAt,
            approval_status: "pending",
            active_status: "inactive",
            version: 1,
            member_idx: member_idx,
        };

        // 3-1. 개인/사업자별 조건부 필드 처리
        if (isIndividual(biz_type)) {
            baseDbPayload.user_name = nullIfEmpty(payload.user_name);

            // 외국인이면 외국인등록번호, 아니면 주민등록번호
            baseDbPayload.ssn = nullIfEmpty(
                is_foreigner === "Y"
                    ? payload.foreigner_registration_number
                    : payload.ssn
            );

            // 미성년자/외국인이 아니면 신분증 종류 업데이트
            if (is_minor === "N" && is_foreigner === "N") {
                baseDbPayload.identification_type = nullIfEmpty(
                    payload.identification_type
                );
            }

            // 미성년자면 보호자 정보 업데이트
            if (is_minor === "Y") {
                baseDbPayload.guardian_name = nullIfEmpty(
                    payload.guardian_name
                );
                baseDbPayload.guardian_tel = nullIfEmpty(payload.guardian_tel);
            }
        }

        // 3-2. 사업자(개인/법인)일 경우에만 업데이트
        if (isBizType(biz_type)) {
            baseDbPayload.biz_name = nullIfEmpty(payload.biz_name);
            baseDbPayload.biz_reg_no = nullIfEmpty(payload.biz_reg_no);
        }

        // 3-3. 법인일 경우에만 업데이트
        if (biz_type === "corporate_business") {
            baseDbPayload.corp_name = nullIfEmpty(payload.corp_name);
            baseDbPayload.corp_reg_no = nullIfEmpty(payload.corp_reg_no);
        }

        // 4. 파일 처리 (신규 업로드)
        const finalAttachments = [];

        // 4-1. 신규 파일 S3 업로드
        const s3UploadResults = await Promise.all(
            fileUploads.map(async ({ fieldName, file }) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const extension = file.name.split(".").pop();
                const uniqueId = crypto.randomBytes(16).toString("hex");
                const s3FileName = `${uniqueId}.${extension}`;
                const s3Key = `cr_console/payee_documents/${fieldName}/${s3FileName}`;
                const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${s3Key}`;

                await uploadFileToS3(buffer, s3Key, file.type);
                newlyUploadedS3Keys.push(s3Key);

                // 신규 파일 추가
                finalAttachments.push({
                    fieldName: fieldName,
                    file: buffer,
                    filename: file.name,
                });

                return {
                    fieldName,
                    s3Key,
                    fileUrl,
                    file,
                    extension,
                    dbFileName: s3FileName,
                };
            })
        );

        const COL_ID = MONDAY_COLUMN_IDS.PAYEE_LOG;
        const LABEL_MAP = MONDAY_LABEL.PAYEE_LOG;

        // 5-1. 사업자 구분 라벨 매핑
        let bizTypeLabel = LABEL_MAP.BIZ_TYPE.INDIVIDUAL;
        if (biz_type === "sole_proprietor")
            bizTypeLabel = LABEL_MAP.BIZ_TYPE.SOLE_PROPRIETOR;
        if (biz_type === "corporate_business")
            bizTypeLabel = LABEL_MAP.BIZ_TYPE.CORPORATE;
        if (biz_type === "simple_taxpayer")
            bizTypeLabel = LABEL_MAP.BIZ_TYPE.SIMPLE_TAXPAYER;
        if (biz_type === "tax_free_business")
            bizTypeLabel = LABEL_MAP.BIZ_TYPE.TAX_FREE_BUSINESS;

        // 5-2. 발행 유형 드롭다운 매핑 (DB코드 -> 한글 라벨)
        // (예: payload.invoice_type = 'tax_invoice' -> '세금계산서')
        // 매칭되는 키가 없으면 값 그대로 사용
        const invoiceTypeLabel =
            LABEL_MAP.ISSUE_TYPES[payload.invoice_type?.toUpperCase()] ||
            payload.invoice_type;

        const mondayColumnValues = {
            [COL_ID.CREATED_TYPE]: { label: LABEL_MAP.CREATED_TYPE.CREATE },
            [COL_ID.BIZ_TYPE_STATUS]: { label: bizTypeLabel },
            [COL_ID.CORP_NAME]: baseDbPayload.biz_name,
            [COL_ID.BIZ_REG_NO]: baseDbPayload.biz_reg_no,
            [COL_ID.USER_NAME]: baseDbPayload.user_name,
            [COL_ID.SSN]: baseDbPayload.ssn,
            [COL_ID.FOREIGN_REG_NO]:
                is_foreigner === "Y" ? baseDbPayload.ssn : null,
            [COL_ID.PHONE]: payload.tel
                ? { phone: payload.tel, countryShortName: "KR" }
                : null,
            [COL_ID.EMAIL]: payload.email
                ? { email: payload.email, text: payload.email }
                : null,
            [COL_ID.GUARDIAN_NAME]: baseDbPayload.guardian_name,
            [COL_ID.GUARDIAN_PHONE]: baseDbPayload.guardian_tel
                ? { phone: baseDbPayload.guardian_tel, countryShortName: "KR" }
                : null,
            [COL_ID.BANK_NAME]: baseDbPayload.bank_name,
            [COL_ID.ACCOUNT_HOLDER]: baseDbPayload.account_holder,
            [COL_ID.ACCOUNT_NUMBER]: baseDbPayload.account_number,
            [COL_ID.SWIFT_CODE]: baseDbPayload.swift_code,
            [COL_ID.BANK_ADDRESS]: baseDbPayload.bank_address,
            [COL_ID.INVOICE_TYPE]: invoiceTypeLabel
                ? { labels: [invoiceTypeLabel] }
                : null,
            [COL_ID.TAX]: Number(baseDbPayload.tax),
            [COL_ID.VERSION]: 1,
        };

        // null 또는 undefined 값 제거 (API 오류 방지)
        Object.keys(mondayColumnValues).forEach((key) => {
            if (
                mondayColumnValues[key] === null ||
                mondayColumnValues[key] === undefined
            ) {
                delete mondayColumnValues[key];
            }
        });

        let mondayItemId = null;
        try {
            const itemName =
                baseDbPayload.user_name ||
                baseDbPayload.biz_name ||
                "수취인정보 수정요청";
            mondayItemId = await createMondayItem(
                MONDAY_BOARD_IDS.PAYEE_LOG,
                itemName,
                mondayColumnValues
            );
            console.log("업로드완료했음");

            // 5-3 아이템 생성 후 파일 업로드 실행(finalAttachments 사용)
            if (mondayItemId && finalAttachments.length > 0) {
                // 병렬 처리 (Promise.all)
                const uploadPromises = finalAttachments.map(
                    async ({ fieldName, file, filename }) => {
                        let targetColId = null;

                        // fieldName(폼 name)에 따라 먼데이 컬럼 ID 매핑
                        if (fieldName === "business_document")
                            targetColId = COL_ID.BIZ_REG_FILE;
                        else if (fieldName === "id_document")
                            targetColId = COL_ID.ID_FILE;
                        else if (fieldName === "family_relation_certificate")
                            targetColId = COL_ID.RELATION_FILE;
                        else if (fieldName === "bank_document")
                            targetColId = COL_ID.BANK_COPY_FILE;

                        if (targetColId) {
                            await uploadFileToMonday(
                                mondayItemId,
                                targetColId,
                                file,
                                filename
                            );
                        }
                    }
                );

                // 파일 업로드는 실패해도 메인 로직(DB저장)을 막지 않도록 catch 처리 하거나 await
                console.log("Starting Monday file uploads...");
                await Promise.allSettled(uploadPromises);

                console.log("await후", uploadPromises);
            }
        } catch (e) {
            throw new Error(`먼데이 연동 실패: ${e.message}`);
        }

        // 6. DB 트랜잭션 시작

        connection = await dbConnect();
        await connection.beginTransaction();
        // 6-0. Member 정보 UPDATE (수정)
        await connection.query(
            `UPDATE ${TABLE_NAMES.SBN_MEMBER} SET ?, updated_at = NOW() WHERE idx = ?`,
            [baseUserPayload, member_idx]
        );
        // 6-1. Payee 정보 INSERT (신규 등록)
        const [payeeResult] = await connection.query(
            `INSERT INTO ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET ?`,
            baseDbPayload
        );
        const payee_idx = payeeResult.insertId;

        // 6-2. Log 테이블에 이력 저장 (스냅샷)
        const logPayload = {
            ...baseDbPayload,
            member_idx: member_idx,
            payee_idx: payee_idx, // 생성된 원본 ID 연결
            payout_ratio_id: mondayItemId, // 먼데이 ID 추가
            created_at: new Date(),
        };
        // updated_at이나 기타 불필요 필드 제거가 필요하다면 수행 (Insert시엔 보통 무관)

        const [logResult] = await connection.query(
            `INSERT INTO ${TABLE_NAMES.SBN_MEMBER_PAYEE_LOG} SET ?`,
            logPayload
        );
        const log_idx = logResult.insertId;

        // 7. 파일 정보 DB 저장 (Master & Log)

        if (s3UploadResults.length > 0) {
            for (const r of s3UploadResults) {
                const tag = r.fieldName;
                const parentIdx = 0; // 신규는 부모 없음

                // A. Payee 테이블용 INSERT
                const payeeFilePayload = {
                    type: FILE_TYPE_TAG,
                    ref_table_name: TABLE_NAMES.SBN_MEMBER_PAYEE,
                    ref_table_idx: payee_idx,
                    file_url: r.fileUrl,
                    file_name: r.dbFileName,
                    file_realname: r.file.name,
                    file_ext: r.extension,
                    file_size: String(r.file.size),
                    seq: 0,
                    tag: tag,
                    version: 1,
                    parent_idx: parentIdx,
                    creator_id: member_idx,
                };
                await connection.query(
                    `INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO} SET ?`,
                    payeeFilePayload
                );

                // B. Log 테이블용 스냅샷 INSERT
                const logFilePayload = {
                    ...payeeFilePayload,
                    ref_table_name: TABLE_NAMES.SBN_MEMBER_PAYEE_LOG, // Log 테이블 참조
                    ref_table_idx: log_idx, // Log 테이블 IDX
                    version: 1,
                    parent_idx: 0,
                };
                await connection.query(
                    `INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO} SET ?`,
                    logFilePayload
                );
            }
        }
        // 신규 등록이므로 '기존 파일 복사(7-2)' 로직은 필요 없음

        await connection.commit();

        return NextResponse.json(
            {
                message: "수취인 정보 등록 및 검수 요청이 완료되었습니다.",
                payout_ratio_id: mondayItemId,
            },
            { status: 200 }
        );
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }
        // DB 실패 시 S3 파일 삭제
        if (newlyUploadedS3Keys.length > 0) {
            try {
                await Promise.all(
                    newlyUploadedS3Keys.map((key) => deleteFileFromS3(key))
                );
            } catch {}
        }
        console.error("Register Error:", error);

        let errorMessage = "서버 오류가 발생했습니다.";
        if (error.message.includes("먼데이")) errorMessage = error.message;

        return NextResponse.json(
            { message: errorMessage, error: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch {}
        }
    }
}
