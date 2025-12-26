export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import {TABLE_NAMES, MONDAY_BOARD_IDS, MONDAY_API_CONFIG} from "@/constants/dbConstants";
import {NextResponse} from "next/server";
import {uploadFileToS3, deleteFileFromS3} from "@/lib/s3-client";
import {createMondayLogItem} from "@/lib/mondayCommon";
import crypto from "crypto";
import {cookies} from "next/headers";

const DUMMY_PAYOUT_RATIO_ID = "DEFAULT_RATIO";
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

export async function POST(req) {
    let connection;
    const newlyUploadedS3Keys = [];

  try {
    const formData = await req.formData();
    const payload = {};
    const fileUploads = [];

        // 1) FormData 파싱
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                if (value.size > 0) fileUploads.push({ fieldName: key, file: value });
            } else {
                payload[key] = toYn(value);
            }
        }

        // 2) 인증 확인
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                { message: "인증 정보가 없습니다." },
                { status: 401 }
            );
        }
        const member_idx = parseInt(memberIdxCookie.value, 10);

        // 3) DB Payload 준비
        const biz_type = payload.biz_type
        const baseDbPayload = {
            biz_type: nullIfEmpty(biz_type),
            is_overseas: nullIfEmpty(toYn(payload.is_overseas)),
            is_minor: nullIfEmpty(toYn(payload.is_minor)),
            is_foreigner: nullIfEmpty(toYn(payload.is_foreigner)),
            bank_name: nullIfEmpty(payload.bank_name),
            account_holder: nullIfEmpty(payload.account_holder),
            account_number: nullIfEmpty(payload.account_number),
            swift_code: nullIfEmpty(payload.swift_code),
            bank_address: nullIfEmpty(payload.bank_address),
            invoice_type: nullIfEmpty(payload.invoice_type),
            is_simple_taxpayer: nullIfEmpty(toYn(payload.is_simple_taxpayer)),

            // 상태값 설정 (검수 요청 시 pending / inactive)
            approval_status: "pending",
            active_status: "inactive",

            user_name: isIndividual(biz_type) ? nullIfEmpty(payload.user_name) : null,
            ssn: isIndividual(biz_type)
                ? nullIfEmpty(toYn(payload.is_foreigner) === "Y" ? payload.foreigner_registration_number : payload.ssn)
                : null,
            identification_type:
                isIndividual(biz_type) && toYn(payload.is_minor) === "N" && toYn(payload.is_foreigner) === "N"
                    ? nullIfEmpty(payload.identification_type)
                    : null,
            biz_name: isBizType(biz_type) ? nullIfEmpty(payload.biz_name) : null,
            biz_reg_no: isBizType(biz_type) ? nullIfEmpty(payload.biz_reg_no) : null,
            guardian_name: toYn(payload.is_minor) === "Y" ? nullIfEmpty(payload.guardian_name) : null,
            guardian_tel: toYn(payload.is_minor) === "Y" ? nullIfEmpty(payload.guardian_tel) : null,
        };

        if (payload.agree_expired_at) {
            baseDbPayload.agree_expired_at = nullIfEmpty(payload.agree_expired_at);
        }

        // 4) S3 업로드 (DB 연결 전 수행)
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

                return { fieldName, s3Key, fileUrl, file, extension, dbFileName: s3FileName };
            })
        );

        // 5) 먼데이닷컴 아이템 생성 (ID 발급)
        const mondayColumnValues = {}; // TODO: 각 컬럼별 아이디 맵핑 필요함
        let mondayItemId = null;

        try {
            const itemName = baseDbPayload.user_name || baseDbPayload.biz_name || "수취인정보 수정요청";
            mondayItemId = await createMondayLogItem(MONDAY_BOARD_IDS.PAYEE_REQUEST_LOG, itemName, mondayColumnValues);
        } catch (e) {
            // S3 파일 삭제 등 정리를 위해 에러 throw
            throw new Error(`먼데이 연동 실패: ${e.message}`);
        }

        // 발급받은 먼데이 ID를 DB Payload에 매핑
        baseDbPayload.payout_ratio_id = mondayItemId;

        // 6) DB 트랜잭션 시작
        connection = await dbConnect();
        await connection.beginTransaction();

        // 6-1) Payee idx 조회
        const [payeeRows] = await connection.query(
            `SELECT idx FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} WHERE member_idx = ? ORDER BY created_at DESC LIMIT 1`,
            [member_idx]
        );

        if (!payeeRows || payeeRows.length === 0) {
            throw new Error("수정할 수취인 정보를 찾을 수 없습니다.");
        }
        const payee_idx = payeeRows[0].idx;

        // 6-2) Payee 테이블 UPDATE (텍스트 정보 갱신)
        await connection.query(
            `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET ?, updated_at = NOW() WHERE idx = ?`,
            [baseDbPayload, payee_idx]
        );

        // 6-3) Log 테이블 INSERT (이력 생성)
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

        // =================================================================================
        // 7) 파일 처리 (Versioning & Log Snapshot)
        // =================================================================================

        // 7-1) 신규 업로드 파일 처리
        if (s3UploadResults.length > 0) {
            for (const r of s3UploadResults) {
                const tag = r.fieldName;

                // [A. Payee 테이블용] 최신 버전 조회
                const [prevFileRows] = await connection.query(
                    `SELECT idx, version FROM ${TABLE_NAMES.SBN_FILE_INFO} 
                     WHERE ref_table_name = ? AND ref_table_idx = ? AND tag = ? 
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
                await connection.query(`INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO} SET ?`, payeeFilePayload);

                // [B. Log 테이블용] 스냅샷 INSERT (로그 테이블 참조)
                const logFilePayload = {
                    ...payeeFilePayload,
                    ref_table_name: TABLE_NAMES.SBN_MEMBER_PAYEE_LOG, // ✅ 로그 테이블 참조
                    ref_table_idx: log_idx,                           // ✅ 로그 테이블 IDX
                    version: 1,
                    parent_idx: 0,
                };
                await connection.query(`INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO} SET ?`, logFilePayload);
            }
        }

        // 7-2) 변경되지 않은 기존 파일들을 Log로 복사 (스냅샷 완성)
        // 이번에 업로드되지 않은 태그들 중, Payee에 존재하는 '최신 버전' 파일들을 Log로 복사
        const uploadedTags = s3UploadResults.map(r => r.fieldName);

        let excludeCondition = "";
        if (uploadedTags.length > 0) {
            const tagsStr = uploadedTags.map(t => `'${t}'`).join(",");
            excludeCondition = `AND tag NOT IN (${tagsStr})`;
        }

        // 최신 파일 조회
        const [unchangedFiles] = await connection.query(
            `SELECT * FROM ${TABLE_NAMES.SBN_FILE_INFO} t1
         WHERE ref_table_name = ? 
           AND ref_table_idx = ?
           ${excludeCondition}
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
            (type, ref_table_name, ref_table_idx, file_url, file_name, file_realname, file_ext, file_size, seq, tag, version, memo, creator_id, create_datetime)
            VALUES ?`,
                [fileLogValues]
            );
        }

    await connection.commit();

        return NextResponse.json(
            { message: "정보 수정 요청이 완료되었습니다.", payout_ratio_id: mondayItemId },
            { status: 200 }
        );
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch {}
        }
        // DB 실패 시, 이미 올라간 S3 파일 삭제
        if (newlyUploadedS3Keys.length > 0) {
            try { await Promise.all(newlyUploadedS3Keys.map((key) => deleteFileFromS3(key))); } catch {}
        }
        console.error("Update Error:", error);
        return NextResponse.json(
            { message: error.message || "서버 오류가 발생했습니다." },
            { status: 500 }
        );
    } finally {
        if (connection) {
            try { connection.release(); } catch {}
        }
    }
}
