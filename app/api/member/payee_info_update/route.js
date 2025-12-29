export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import {TABLE_NAMES, MONDAY_BOARD_IDS, MONDAY_COLUMN_IDS} from "@/constants/dbConstants";
import { MONDAY_LABEL } from "@/constants/mondayLabel";
import {NextResponse} from "next/server";
import {uploadFileToS3, deleteFileFromS3, getFileBufferFromS3} from "@/lib/s3-client";
import {createMondayLogItem, uploadFileToMonday} from "@/lib/mondayCommon";
import crypto from "crypto";
import {cookies} from "next/headers";

const FILE_TYPE_TAG = "PAYEE_DOCUMENT";

/**
 * Utils
 */
const toYn = (v) => {
    if (v === true || v === "true") return "Y";
    if (v === false || v === "false") return "N";
    if (v === "Y" || v === "N") return v;
    return v;
};

const nullIfEmpty = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
};

const isBizType = (bizType) =>
    ["sole_proprietor", "corporate_business"].includes(bizType);
const isIndividual = (bizType) => bizType === "individual";

const calculateExpirationDate = (consentType) => {
    const date = new Date(); // 현재 서버 시간

    if (consentType === "30days") {
        date.setDate(date.getDate() + 30); // 30일 뒤
    } else {
        date.setDate(date.getDate() + 1);  // 내일 (매번 재확인이므로 유효기간 짧게)
    }

    return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
};

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
                if (value.size > 0) fileUploads.push({fieldName: key, file: value});
            } else {
                payload[key] = value;
            }
        }

        // 2. 사용자 인증 (쿠키)
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                {message: "인증 정보가 없습니다."},
                {status: 401}
            );
        }
        const member_idx = parseInt(memberIdxCookie.value, 10);

        // 3. DB Insert/Update용 Payload 구성
        const biz_type = payload.biz_type;
        const is_overseas = toYn(payload.is_overseas) || 'N';
        const is_minor = toYn(payload.is_minor) || 'N';
        const is_foreigner = toYn(payload.is_foreigner) || 'N';
        const is_simple_taxpayer = toYn(payload.is_simple_taxpayer) || 'N';
        const calculatedExpiredAt = calculateExpirationDate(payload.consent_type);

        const baseDbPayload = {
            biz_type: nullIfEmpty(biz_type),
            is_overseas: is_overseas,
            is_minor: is_minor,
            is_foreigner: is_foreigner,

            bank_name: nullIfEmpty(payload.bank_name),
            account_holder: nullIfEmpty(payload.account_holder),
            account_number: nullIfEmpty(payload.account_number),
            swift_code: nullIfEmpty(payload.swift_code),
            bank_address: nullIfEmpty(payload.bank_address),
            invoice_type: nullIfEmpty(payload.invoice_type),
            is_simple_taxpayer: is_simple_taxpayer,

            agree_expired_at: calculatedExpiredAt,
            approval_status: "pending",
            active_status: "inactive",
        };

        // 3-1. 개인/사업자별 조건부 필드 처리
        if (isIndividual(biz_type)) {
            baseDbPayload.user_name = nullIfEmpty(payload.user_name);

            // 외국인이면 외국인등록번호, 아니면 주민등록번호
            baseDbPayload.ssn = nullIfEmpty(is_foreigner === "Y" ? payload.foreigner_registration_number : payload.ssn);

            // 미성년자/외국인이 아니면 신분증 종류 업데이트
            if (is_minor === "N" && is_foreigner === "N") {
                baseDbPayload.identification_type = nullIfEmpty(payload.identification_type);
            }

            // 미성년자면 보호자 정보 업데이트
            if (is_minor === "Y") {
                baseDbPayload.guardian_name = nullIfEmpty(payload.guardian_name);
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

        // -------------------------------------------------------------
        // 4. 파일 처리 (신규 업로드 + 기존 파일 다운로드 병합)
        // -------------------------------------------------------------

        // ★ 먼데이로 보낼 최종 파일 리스트 [{fieldName, file(Buffer), filename}]
        const finalAttachments = [];

        // 4-1. 신규 파일 S3 업로드
        const s3UploadResults = await Promise.all(
            fileUploads.map(async ({fieldName, file}) => {
                const buffer = Buffer.from(await file.arrayBuffer());
                const extension = file.name.split(".").pop();
                const uniqueId = crypto.randomBytes(16).toString("hex");
                const s3FileName = `${uniqueId}.${extension}`;
                const s3Key = `cr_console/payee_documents/${fieldName}/${s3FileName}`;

                // DB에 저장될 전체 URL
                const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${s3Key}`;

                await uploadFileToS3(buffer, s3Key, file.type);
                newlyUploadedS3Keys.push(s3Key);

                // ★ 신규 파일 추가
                finalAttachments.push({
                    fieldName: fieldName,
                    file: buffer,
                    filename: file.name
                });

                return {fieldName, s3Key, fileUrl, file, extension, dbFileName: s3FileName};
            })
        );

        // 4-2. 기존 파일(이번에 업로드 안 된 파일) 조회 및 다운로드
        connection = await dbConnect();

        // 관리 대상 태그 목록
        const TARGET_TAGS = [
            "business_document",
            "id_document",
            "bank_document",
            "family_relation_certificate"
        ];

        // 현재 멤버의 Payee IDX 조회
        const [currentPayeeRows] = await connection.query(
            `SELECT idx FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} 
             WHERE member_idx = ? ORDER BY created_at DESC LIMIT 1`,
            [member_idx]
        );

        if (currentPayeeRows.length > 0) {
            const currentPayeeIdx = currentPayeeRows[0].idx;

            for (const tag of TARGET_TAGS) {
                // 이번에 새로 올린 파일 목록에 있다면 패스 (이미 finalAttachments에 있음)
                if (fileUploads.some(f => f.fieldName === tag)) continue;

                // 없다면 DB에서 '가장 최신 버전' 파일 정보 조회
                // ref_table_name, ref_table_idx, tag 기준으로 최신 version 1개만 가져옴
                const [existingFileRows] = await connection.query(
                    `SELECT file_url, file_realname 
                     FROM ${TABLE_NAMES.SBN_FILE_INFO}
                     WHERE ref_table_name = ? 
                       AND ref_table_idx = ? 
                       AND tag = ?
                     ORDER BY version DESC LIMIT 1`,
                    [TABLE_NAMES.SBN_MEMBER_PAYEE, currentPayeeIdx, tag]
                );

                if (existingFileRows.length > 0) {
                    const oldFile = existingFileRows[0];
                    // ★ URL에서 S3 Key 추출
                    const s3Key = getKeyFromDbUrl(oldFile.file_url);

                    if (s3Key) {
                        // ★ S3에서 파일 다운로드 (Buffer)
                        const fileBuffer = await getFileBufferFromS3(s3Key);

                        if (fileBuffer) {
                            // ★ 기존 파일 추가
                            finalAttachments.push({
                                fieldName: tag,
                                file: fileBuffer,
                                filename: oldFile.file_realname // DB에 저장된 실제 파일명 사용
                            });
                        }
                    }
                }
            }
        }

        // 5. 먼데이닷컴 아이템 생성 (데이터 매핑)
        const COL_ID = MONDAY_COLUMN_IDS.PAYEE_LOG;
        const LABEL_MAP = MONDAY_LABEL.PAYEE_LOG;

        // 5-1. 사업자 구분 라벨 매핑
        let bizTypeLabel = LABEL_MAP.BIZ_TYPE.INDIVIDUAL;
        if (biz_type === "sole_proprietor") bizTypeLabel = LABEL_MAP.BIZ_TYPE.SOLE_PROPRIETOR;
        if (biz_type === "corporate_business") bizTypeLabel = LABEL_MAP.BIZ_TYPE.CORPORATE;

        // 5-2. 발행 유형 드롭다운 매핑 (DB코드 -> 한글 라벨)
        // (예: payload.invoice_type = 'tax_invoice' -> '세금계산서')
        // 매칭되는 키가 없으면 값 그대로 사용
        const invoiceTypeLabel = LABEL_MAP.ISSUE_TYPES[payload.invoice_type?.toUpperCase()] || payload.invoice_type;

        const mondayColumnValues = {
            [COL_ID.BIZ_TYPE_STATUS]: { label: bizTypeLabel },
            [COL_ID.CORP_NAME]: baseDbPayload.corp_name || baseDbPayload.biz_name,
            [COL_ID.BIZ_REG_NO]: baseDbPayload.biz_reg_no || baseDbPayload.corp_reg_no,
            [COL_ID.USER_NAME]: baseDbPayload.user_name,
            [COL_ID.SSN]: baseDbPayload.ssn,
            [COL_ID.FOREIGN_REG_NO]: is_foreigner === "Y" ? baseDbPayload.ssn : null,
            [COL_ID.PHONE]: payload.tel ? { phone: payload.tel, countryShortName: "KR" } : null,
            [COL_ID.EMAIL]: payload.email ? { email: payload.email, text: payload.email } : null,
            [COL_ID.GUARDIAN_NAME]: baseDbPayload.guardian_name,
            [COL_ID.GUARDIAN_PHONE]: baseDbPayload.guardian_tel ? { phone: baseDbPayload.guardian_tel, countryShortName: "KR" } : null,
            [COL_ID.BANK_NAME]: baseDbPayload.bank_name,
            [COL_ID.ACCOUNT_HOLDER]: baseDbPayload.account_holder,
            [COL_ID.ACCOUNT_NUMBER]: baseDbPayload.account_number,
            [COL_ID.SWIFT_CODE]: baseDbPayload.swift_code,
            [COL_ID.BANK_ADDRESS]: baseDbPayload.bank_address,
            [COL_ID.IS_SIMPLE_TAX]: is_simple_taxpayer === 'Y' ? { checked: true } : null,
            [COL_ID.INVOICE_TYPE]: invoiceTypeLabel ? { labels: [invoiceTypeLabel] } : null,
        };

        // null 또는 undefined 값 제거 (API 오류 방지)
        Object.keys(mondayColumnValues).forEach(key => {
            if (mondayColumnValues[key] === null || mondayColumnValues[key] === undefined) {
                delete mondayColumnValues[key];
            }
        });

        let mondayItemId = null;
        try {
            const itemName = baseDbPayload.user_name || baseDbPayload.biz_name || "수취인정보 수정요청";
            mondayItemId = await createMondayLogItem(MONDAY_BOARD_IDS.PAYEE_LOG, itemName, mondayColumnValues);

            // 5-3 아이템 생성 후 파일 업로드 실행(finalAttachments 사용)
            if (mondayItemId && finalAttachments.length > 0) {
                // 병렬 처리 (Promise.all)
                const uploadPromises = finalAttachments.map(async ({fieldName, file, filename}) => {
                    let targetColId = null;

                    // fieldName(폼 name)에 따라 먼데이 컬럼 ID 매핑
                    if (fieldName === 'business_document') targetColId = COL_ID.BIZ_REG_FILE;
                    else if (fieldName === 'id_document') targetColId = COL_ID.ID_FILE;
                    else if (fieldName === 'family_relation_certificate') targetColId = COL_ID.RELATION_FILE;
                    else if (fieldName === 'bank_document') targetColId = COL_ID.BANK_COPY_FILE;

                    if (targetColId) {
                        await uploadFileToMonday(mondayItemId, targetColId, file, filename);
                    }
                });

                // 파일 업로드는 실패해도 메인 로직(DB저장)을 막지 않도록 catch 처리 하거나 await
                await Promise.allSettled(uploadPromises);
            }

        } catch (e) {
            throw new Error(`먼데이 연동 실패: ${e.message}`);
        }

        // 6. DB 트랜잭션 시작
        baseDbPayload.payout_ratio_id = mondayItemId; // 먼데이 ID 저장

        connection = await dbConnect();
        await connection.beginTransaction();

        // 6-1. 기존 Payee 정보 조회
        const [payeeRows] = await connection.query(
            `SELECT idx FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} WHERE member_idx = ? ORDER BY created_at DESC LIMIT 1`,
            [member_idx]
        );

        if (!payeeRows || payeeRows.length === 0) {
            throw new Error("수정할 수취인 정보를 찾을 수 없습니다.");
        }
        const payee_idx = payeeRows[0].idx;

        // 6-2. Payee 정보 업데이트 (현재 정보 갱신)
        // updated_at 갱신 포함
        await connection.query(
            `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET ?, updated_at = NOW() WHERE idx = ?`,
            [baseDbPayload, payee_idx]
        );

        // 6-3. Log 테이블에 이력 저장 (스냅샷)
        const logPayload = {
            ...baseDbPayload,
            member_idx: member_idx,
            payee_idx: payee_idx,
            created_at: new Date(),
        };
        delete logPayload.updated_at;

        const [logResult] = await connection.query(
            `INSERT INTO ${TABLE_NAMES.SBN_MEMBER_PAYEE_LOG} SET ?`,
            logPayload
        );
        const log_idx = logResult.insertId;

        // 7. 파일 정보 DB 저장 (Versioning & Log Snapshot)

        // 7-1. 신규 업로드 파일 저장
        if (s3UploadResults.length > 0) {
            for (const r of s3UploadResults) {
                const tag = r.fieldName;

                // [A. Payee 테이블용] 최신 버전 조회
                const [prevFileRows] = await connection.query(
                    `SELECT idx, version
                     FROM ${TABLE_NAMES.SBN_FILE_INFO}
                     WHERE ref_table_name = ?
                       AND ref_table_idx = ?
                       AND tag = ?
                     ORDER BY version DESC LIMIT 1`,
                    [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx, tag]
                );

                let newVersion = 1;
                let parentIdx = 0;

                if (prevFileRows.length > 0) {
                    newVersion = prevFileRows[0].version + 1; // 버전 +1
                    parentIdx = prevFileRows[0].idx;          // 이전 파일이 부모
                }

                // Payee 테이블용 INSERT (버전 업, 기존 파일 유지)
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
                    version: newVersion,
                    parent_idx: parentIdx,
                    creator_id: member_idx,
                };
                await connection.query(`INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO}
                                        SET ?`, payeeFilePayload);

                // B. Log 테이블용 스냅샷 INSERT (항상 버전 1)
                const logFilePayload = {
                    ...payeeFilePayload,
                    ref_table_name: TABLE_NAMES.SBN_MEMBER_PAYEE_LOG, // ✅ 로그 테이블 참조
                    ref_table_idx: log_idx,                           // ✅ 로그 테이블 IDX
                    version: 1,
                    parent_idx: 0,
                };
                await connection.query(`INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO}
                                        SET ?`, logFilePayload);
            }
        }

        // 7-2. 변경되지 않은 기존 파일들을 Log 테이블로 복사 (스냅샷 완성)
        // 이번에 업로드되지 않은 태그들 중, Payee에 존재하는 '최신 버전' 파일들을 Log로 복사
        const uploadedTags = s3UploadResults.map(r => r.fieldName);

        let excludeCondition = "";
        if (uploadedTags.length > 0) {
            const tagsStr = uploadedTags.map(t => `'${t}'`).join(",");
            excludeCondition = `AND tag NOT IN (${tagsStr})`;
        }

        // 최신 파일 조회
        const [unchangedFiles] = await connection.query(
            `SELECT *
             FROM ${TABLE_NAMES.SBN_FILE_INFO} t1
             WHERE ref_table_name = ?
               AND ref_table_idx = ? ${excludeCondition}
           AND version = (
               SELECT MAX(version) FROM ${TABLE_NAMES.SBN_FILE_INFO} t2
                 WHERE t2.ref_table_name = t1.ref_table_name
               AND t2.ref_table_idx = t1.ref_table_idx
               AND t2.tag = t1.tag
                 )`,
            [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx]
        );

        if (unchangedFiles.length > 0) {
            const fileLogValues = unchangedFiles.map(file => [
                file.type,
                TABLE_NAMES.SBN_MEMBER_PAYEE_LOG, // ✅ 로그 테이블 참조
                log_idx,                          // ✅ 로그 테이블 IDX
                file.file_url,
                file.file_name,
                file.file_realname,
                file.file_ext,
                file.file_size,
                file.seq,
                file.tag,
                file.version, // 원본 버전 기록
                file.memo,
                file.creator_id,
                new Date() // create_datetime
            ]);

            await connection.query(
                `INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO}
                 (type, ref_table_name, ref_table_idx, file_url, file_name, file_realname, file_ext, file_size, seq,
                  tag, version, memo, creator_id, create_datetime)
                 VALUES ?`,
                [fileLogValues]
            );
        }

        await connection.commit();

        return NextResponse.json(
            {message: "정보 수정 요청이 완료되었습니다.", payout_ratio_id: mondayItemId},
            {status: 200}
        );
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {
            }
        }
        // DB 실패 시, 이미 올라간 S3 파일 삭제
        if (newlyUploadedS3Keys.length > 0) {
            try {
                await Promise.all(newlyUploadedS3Keys.map((key) => deleteFileFromS3(key)));
            } catch {
            }
        }
        console.error("Update Error:", error);
        return NextResponse.json(
            {message: error.message || "서버 오류가 발생했습니다."},
            {status: 500}
        );
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch {
            }
        }
    }
}
