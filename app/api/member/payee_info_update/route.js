export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import { TABLE_NAMES } from "@/constants/dbConstants";
import { NextResponse } from "next/server";
import { uploadFileToS3, deleteFileFromS3 } from "@/lib/s3-client";
import crypto from "crypto";
import { cookies } from "next/headers";

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
    let existingFilesS3KeysToDelete = [];

    try {
        const formData = await req.formData();
        const payload = {};
        const fileUploads = [];

        /**
         * 1) FormData 파싱 (text/file 분리)
         */
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                if (value.size > 0)
                    fileUploads.push({ fieldName: key, file: value });
            } else {
                payload[key] = toYn(value);
            }
        }

        /**
         * 2) 인증: member_idx (cookie)  ✅ Next.js 최신: cookies()는 async
         */
        const cookieStore = await cookies();
        const memberIdxCookie = cookieStore.get("member_idx");

        if (!memberIdxCookie || !memberIdxCookie.value) {
            return NextResponse.json(
                { message: "인증 정보가 없습니다. 다시 로그인해 주세요." },
                { status: 401 }
            );
        }

        const member_idx = parseInt(memberIdxCookie.value, 10);
        if (Number.isNaN(member_idx) || member_idx <= 0) {
            return NextResponse.json(
                { message: "유효하지 않은 사용자 ID입니다." },
                { status: 401 }
            );
        }

        /**
         * 3) Payee Info 테이블에 UPDATE할 최종 페이로드 준비
         */
        payload.member_idx = member_idx;
        payload.payout_ratio_id = DUMMY_PAYOUT_RATIO_ID;
        payload.active_status = "inactive";

        const biz_type = payload.biz_type;
        const is_overseas = toYn(payload.is_overseas);
        const is_minor = toYn(payload.is_minor);
        const is_foreigner = toYn(payload.is_foreigner);

        const dbPayload = {
            biz_type: nullIfEmpty(biz_type),
            is_overseas: nullIfEmpty(is_overseas),
            is_minor: nullIfEmpty(is_minor),
            is_foreigner: nullIfEmpty(is_foreigner),

            bank_name: nullIfEmpty(payload.bank_name),
            account_holder: nullIfEmpty(payload.account_holder),
            account_number: nullIfEmpty(payload.account_number),
            swift_code: nullIfEmpty(payload.swift_code),
            bank_address: nullIfEmpty(payload.bank_address),

            invoice_type: nullIfEmpty(payload.invoice_type),
            is_simple_taxpayer: nullIfEmpty(toYn(payload.is_simple_taxpayer)),

            active_status: nullIfEmpty(payload.active_status),

            user_name: isIndividual(biz_type)
                ? nullIfEmpty(payload.user_name)
                : null,
            ssn: isIndividual(biz_type)
                ? nullIfEmpty(
                      is_foreigner === "Y"
                          ? payload.foreigner_registration_number
                          : payload.ssn
                  )
                : null,
            identification_type:
                isIndividual(biz_type) &&
                is_minor === "N" &&
                is_foreigner === "N"
                    ? nullIfEmpty(payload.identification_type)
                    : null,

            biz_name: isBizType(biz_type)
                ? nullIfEmpty(payload.biz_name)
                : null,
            biz_reg_no: isBizType(biz_type)
                ? nullIfEmpty(payload.biz_reg_no)
                : null,

            guardian_name:
                is_minor === "Y" ? nullIfEmpty(payload.guardian_name) : null,
            guardian_tel:
                is_minor === "Y" ? nullIfEmpty(payload.guardian_tel) : null,
        };

        // 메타데이터 업데이트(선택)
        if (payload.agree_expired_at) {
            dbPayload.agree_expired_at = nullIfEmpty(payload.agree_expired_at);
        }

        /**
         * 4) S3 업로드 (트랜잭션 바깥)
         */
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

        /**
         * 5) DB 트랜잭션
         */
        connection = await dbConnect();
        await connection.beginTransaction();

        const [payeeRows] = await connection.query(
            `SELECT idx FROM ${TABLE_NAMES.SBN_MEMBER_PAYEE} WHERE member_idx = ? ORDER BY created_at DESC LIMIT 1`,
            [member_idx]
        );

        if (!payeeRows || payeeRows.length === 0) {
            throw new Error("수정할 수취인 정보를 찾을 수 없습니다.");
        }

        const payee_idx = payeeRows[0].idx;

        /**
         * 5-2) 파일 처리 대상 tag 선정 (delete_ + 업로드 tag)
         */
        const fileTagsToProcess = new Set();

        for (const [key, value] of formData.entries()) {
            if (key.startsWith("delete_") && value === "Y") {
                fileTagsToProcess.add(key.substring("delete_".length));
            }
        }

        s3UploadResults.forEach((r) => fileTagsToProcess.add(r.fieldName));

        const tagsArr = Array.from(fileTagsToProcess);

        /**
         * 5-2-1) 기존 파일 메타 조회 + DB 삭제 (tag 단위)
         */
        if (tagsArr.length > 0) {
            const tagsPlaceholder = tagsArr.map(() => "?").join(", ");

            const [existingFiles] = await connection.query(
                `SELECT file_url, tag
           FROM ${TABLE_NAMES.SBN_FILE_INFO}
          WHERE ref_table_name = ?
            AND ref_table_idx = ?
            AND tag IN (${tagsPlaceholder})`,
                [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx, ...tagsArr]
            );

            await connection.execute(
                `DELETE FROM ${TABLE_NAMES.SBN_FILE_INFO}
          WHERE ref_table_name = ?
            AND ref_table_idx = ?
            AND tag IN (${tagsPlaceholder})`,
                [TABLE_NAMES.SBN_MEMBER_PAYEE, payee_idx, ...tagsArr]
            );

            const s3UrlPrefix = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/`;
            existingFiles.forEach((f) => {
                if (f.file_url && f.file_url.startsWith(s3UrlPrefix)) {
                    existingFilesS3KeysToDelete.push(
                        f.file_url.substring(s3UrlPrefix.length)
                    );
                }
            });
        }

        /**
         * 5-3) Payee 업데이트
         */
        await connection.query(
            `UPDATE ${TABLE_NAMES.SBN_MEMBER_PAYEE} SET ?, updated_at = NOW() WHERE idx = ?`,
            [dbPayload, payee_idx]
        );

        /**
         * 5-4) 새 파일 메타 INSERT
         */
        if (s3UploadResults.length > 0) {
            await Promise.all(
                s3UploadResults.map(async (r) => {
                    const fileInfoPayload = {
                        type: FILE_TYPE_TAG,
                        ref_table_name: TABLE_NAMES.SBN_MEMBER_PAYEE,
                        ref_table_idx: payee_idx,
                        file_url: r.fileUrl,
                        file_name: r.dbFileName,
                        file_realname: r.file.name,
                        file_ext: r.extension,
                        file_size: String(r.file.size),
                        seq: 0,
                        tag: r.fieldName,
                        creator_id: member_idx,
                    };

                    await connection.query(
                        `INSERT INTO ${TABLE_NAMES.SBN_FILE_INFO} SET ?`,
                        fileInfoPayload
                    );
                })
            );
        }

        await connection.commit();

        return NextResponse.json(
            { message: "수취인 정보 및 파일이 성공적으로 수정되었습니다." },
            { status: 200 }
        );
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {}
        }

        if (newlyUploadedS3Keys.length > 0) {
            try {
                await Promise.all(
                    newlyUploadedS3Keys.map((key) => deleteFileFromS3(key))
                );
            } catch {}
        }

        const message =
            error?.code && typeof error?.message === "string"
                ? `데이터베이스 오류가 발생했습니다: ${error.message}`
                : `수정 중 서버 오류가 발생했습니다: ${
                      error?.message ?? "Unknown error"
                  }`;

        return NextResponse.json(
            { message, error: error?.message ?? String(error) },
            { status: 500 }
        );
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch {}
        }

        if (existingFilesS3KeysToDelete.length > 0) {
            try {
                await Promise.all(
                    existingFilesS3KeysToDelete.map((key) =>
                        deleteFileFromS3(key)
                    )
                );
            } catch {}
        }
    }
}
