// utils/formatPayeeInfoForEdit.js
import {
    BUSINESS_TYPE_LABEL,
    ID_DOCUMENT_TYPES,
    TAX_ISSUE_TYPE_LABEL,
    ISSUE_TYPES,
    KOREAN_BANKS,
    CONSENT_TYPE,
    BIZ_TYPES,
} from "@/constants/payee-data";

/**
 * GET API 응답 -> edit 페이지 formData 기본 구조
 * formData는 블록 단위 객체:
 *  - basic_info
 *  - biz_type
 *  - personal_info
 *  - biz_info
 *  - account_info
 *  - tax_info
 */
export const createInitialFormData = () => ({
    basic_info: {
        // 동의 유형: 30일 / 매번 재확인 (응답값과 무관하게 기본값은 항상 30days)
        consent_type: "30days",
    },
    biz_type: {
        biz_type: BIZ_TYPES.INDIVIDUAL,
        is_overseas: false,
        is_minor: false,
        is_foreigner: false,
    },
    personal_info: {
        user_name: "",
        tel: "",
        email: "",
        ssn: "",
        identification_type: "",
        id_document: {
            file: null,
            url: null,
            name: "",
            ext: "",
        },
        guardian_name: "",
        guardian_tel: "",
        family_relation_certificate: {
            file: null,
            url: null,
            name: "",
            ext: "",
        },
    },
    biz_info: {
        biz_name: "",
        biz_reg_no: "",
        business_document: {
            file: null,
            url: null,
            name: "",
            ext: "",
        },
    },
    account_info: {
        bank_name: "",
        account_holder: "",
        account_number: "",
        swift_code: "",
        bank_address: "",
        bank_document: {
            file: null,
            url: null,
            name: "",
            ext: "",
        },
    },
    tax_info: {
        invoice_type: "tax_invoice",
        is_simple_taxpayer: false,
    },
});

/** Y/N -> boolean */
const ynToBool = (v) => v === "Y";

/** 1) API 응답 -> formData 매핑 */
export const mapApiToFormData = (apiData) => {
    const row = apiData?.payeeData || null;
    const apiFiles = apiData?.files || {};

    const base = createInitialFormData();
    if (!row) return base;

    // 1) biz_type 플래그
    const bizType = row.biz_type || BIZ_TYPES.INDIVIDUAL;
    const isOverseas = ynToBool(row.is_overseas);
    const isMinor = ynToBool(row.is_minor);
    const isForeigner = ynToBool(row.is_foreigner);

    const biz_type = {
        ...base.biz_type,
        biz_type: bizType,
    };
    if (bizType === BIZ_TYPES.INDIVIDUAL) {
        (biz_type.is_overseas = isOverseas),
            (biz_type.is_minor = isMinor),
            (biz_type.is_foreigner = isForeigner);
    }

    // 2) personal_info
    const personal_info = { ...base.personal_info };
    personal_info.user_name = row.user_name || "";
    personal_info.tel = row.tel || "";
    personal_info.email = row.email || "";

    if (bizType === BIZ_TYPES.INDIVIDUAL) {
        // 내국인
        if (!isForeigner) {
            personal_info.ssn = row.ssn || "";
            personal_info.identification_type = row.identification_type || "";
        } else {
            // 외국인: ssn은 외국인등록번호로 사용, identification_type는 기본 foreigner_card
            personal_info.ssn = row.ssn || "";
            personal_info.identification_type =
                row.identification_type || "foreigner_card";
        }

        if (isMinor) {
            personal_info.guardian_name = row.guardian_name || "";
            personal_info.guardian_tel = row.guardian_tel || "";
        }
    }

    // 파일: 신분증 / 가족관계증명서
    personal_info.id_document = {
        ...base.personal_info.id_document,
        url: apiFiles.id_document?.url || null,
        name: apiFiles.id_document?.name || "",
        ext: apiFiles.id_document?.ext || "",
    };
    personal_info.family_relation_certificate = {
        ...base.personal_info.family_relation_certificate,
        url: apiFiles.family_relation_certificate?.url || null,
        name: apiFiles.family_relation_certificate?.name || "",
        ext: apiFiles.family_relation_certificate?.ext || "",
    };

    // 3) biz_info (개인사업자/법인)
    const biz_info = { ...base.biz_info };
    if (bizType === BIZ_TYPES.SOLE_PROPRIETOR) {
        biz_info.biz_name = row.biz_name || "";
        biz_info.biz_reg_no = row.biz_reg_no || "";
    } else if (bizType === BIZ_TYPES.CORPORATE_BUSINESS) {
        biz_info.biz_name = row.corp_name || "";
        biz_info.biz_reg_no = row.corp_reg_no || "";
    }

    biz_info.business_document = {
        ...base.biz_info.business_document,
        url: apiFiles.business_document?.url || null,
        name: apiFiles.business_document?.name || "",
        ext: apiFiles.business_document?.ext || "",
    };

    // 4) account_info
    const account_info = {
        ...base.account_info,
        bank_name: row.bank_name || "",
        account_holder: row.account_holder || "",
        account_number: row.account_number || "",
        bank_document: {
            ...base.account_info.bank_document,
            url: apiFiles.bank_document?.url || null,
            name: apiFiles.bank_document?.name || "",
            ext: apiFiles.bank_document?.ext || "",
        },
    };
    if (isOverseas) {
        (account_info.swift_code = row.swift_code || ""),
            (account_info.bank_address = row.bank_address || "");
    }

    // 5) tax_info
    const tax_info = {
        ...base.tax_info,
        invoice_type: row.invoice_type || "tax_invoice",
        is_simple_taxpayer: ynToBool(row.is_simple_taxpayer),
    };

    // 6) basic_info.consent_type
    //    - 서버 메타데이터와 무관하게 항상 "30days"로 초기화
    const basic_info = {
        ...base.basic_info,
        consent_type: "30days",
    };

    return {
        basic_info,
        biz_type,
        personal_info,
        biz_info,
        account_info,
        tax_info,
    };
};

/**
 * 2) formData -> InfoCard 섹션 배열
 *    (블록 구조 기준 + ConsentType 기본)
 */
export const buildEditSections = (formData) => {
    const {
        basic_info,
        biz_type,
        personal_info,
        biz_info,
        account_info,
        tax_info,
    } = formData;

    const sections = [];

    const bizType = biz_type.biz_type;
    const isIndividual = bizType === BIZ_TYPES.INDIVIDUAL;
    const isSoleProp = bizType === BIZ_TYPES.SOLE_PROPRIETOR;
    const isCorp = bizType === BIZ_TYPES.CORPORATE_BUSINESS;
    const isOverseas = biz_type.is_overseas;
    const isMinor = biz_type.is_minor;
    const isForeigner = biz_type.is_foreigner;

    // 1) 기본 정보 (ConsentType)
    sections.push({
        id: "basic_info",
        label: "기본 정보",
        value: [
            {
                id: "consent_type",
                label: "수취 정보 유효기간",
                value:
                    basic_info.consent_type === "30days"
                        ? "30일간 동일한 정보로 정산 받겠습니다."
                        : "정산 시마다 수취 정보를 재확인하겠습니다.",
                type: "radio",
                path: "basic_info.consent_type",
                errorKey: "consent_type",
                options: CONSENT_TYPE,
            },
        ],
    });

    // 2) 사업자 구분 + 특이사항

    const bizTypeSection = {
        id: "biz_type",
        label: "사업자 구분",
        value: [
            {
                id: "biz_type",
                label: "사업자 구분",
                value: BUSINESS_TYPE_LABEL[bizType] || "-",
                type: "radio",
                path: "biz_type.biz_type",
                errorKey: "biz_type",
                options: [
                    {
                        value: BIZ_TYPES.INDIVIDUAL,
                        label: BUSINESS_TYPE_LABEL[BIZ_TYPES.INDIVIDUAL],
                    },
                    {
                        value: BIZ_TYPES.SOLE_PROPRIETOR,
                        label: BUSINESS_TYPE_LABEL[BIZ_TYPES.SOLE_PROPRIETOR],
                    },
                    {
                        value: BIZ_TYPES.CORPORATE_BUSINESS,
                        label: BUSINESS_TYPE_LABEL[
                            BIZ_TYPES.CORPORATE_BUSINESS
                        ],
                    },
                ],
            },
        ],
    };

    if (isIndividual) {
        bizTypeSection.value.push({
            id: "biz_flags",
            label: "특이사항",
            type: "checkbox",
            value: "",
            className: "bg-slate-50 p-6 mt-6",
            options: [
                {
                    id: "is_overseas",
                    label: "해외 거주자",
                    checked: !!isOverseas,
                    path: "biz_type.is_overseas",
                },
                {
                    id: "is_minor",
                    label: "미성년자",
                    checked: !!isMinor,
                    path: "biz_type.is_minor",
                },
                {
                    id: "is_foreigner",
                    label: "외국인",
                    checked: !!isForeigner,
                    path: "biz_type.is_foreigner",
                },
            ],
        });
    }
    sections.push(bizTypeSection);
    const personalFields = [
        {
            id: "user_name",
            label: "이름",
            value: personal_info.user_name,
            type: "text", // UI에서 disabled 처리
            path: "personal_info.user_name",
            readOnly: true,
        },
        {
            id: "tel",
            label: "연락처",
            value: personal_info.tel,
            type: "text",
            path: "personal_info.tel",
            readOnly: true,
        },
        {
            id: "email",
            label: "이메일",
            value: personal_info.email,
            type: "text",
            path: "personal_info.email",
            readOnly: true,
        },
    ];
    // 3) 개인 정보 (개인일 때만)
    if (isIndividual) {
        personalFields.push({
            id: "ssn",
            label: isForeigner ? "외국인등록번호" : "주민등록번호",
            value: personal_info.ssn || "",
            type: "text",
            path: "personal_info.ssn",
            errorKey: "ssn",
            placeholder: "ex) xxxxxx-xxxxxxx",
            maxLength: 14,
        });

        if (!isForeigner && !isMinor) {
            personalFields.push({
                id: "identification_type",
                label: "신분증 종류",
                value: personal_info.identification_type || "",
                type: "select",
                path: "personal_info.identification_type",
                errorKey: "identification_type",
                options: ID_DOCUMENT_TYPES,
                fullWidth: true,
            });
        }
        if (!isMinor) {
            personalFields.push({
                id: "id_document",
                label: isForeigner ? "외국인등록증" : "신분증 사본",
                value: personal_info.id_document?.name || "",
                type: "file",
                path: "personal_info.id_document",
                errorKey: "id_document",
            });
        }
        if (isMinor) {
            personalFields.push(
                {
                    id: "guardian_name",
                    label: "법정대리인 본명",
                    value: personal_info.guardian_name || "",
                    type: "text",
                    path: "personal_info.guardian_name",
                    errorKey: "guardian_name",
                },
                {
                    id: "guardian_tel",
                    label: "법정대리인 연락처",
                    value: personal_info.guardian_tel || "",
                    type: "text",
                    path: "personal_info.guardian_tel",
                    errorKey: "guardian_tel",
                },
                {
                    id: "family_relation_certificate",
                    label: "가족관계증명서",
                    value:
                        personal_info.family_relation_certificate?.name || "",
                    type: "file",
                    path: "personal_info.family_relation_certificate",
                    errorKey: "family_relation_certificate",
                }
            );
        }
    }

    sections.push({
        id: "personal_info",
        label: "개인 정보",
        value: personalFields,
    });
    // 4) 사업자 정보 (개인사업자/법인)
    if (isSoleProp || isCorp) {
        const displayBizLabel = isCorp ? "법인명" : "상호명";
        const displayBizRegLabel = isCorp ? "법인등록번호" : "사업자등록번호";

        sections.push({
            id: "biz_info",
            label: "사업자 정보",
            value: [
                {
                    id: "biz_name",
                    label: displayBizLabel,
                    value: biz_info.biz_name || "",
                    type: "text",
                    path: "biz_info.biz_name",
                    errorKey: "biz_name",
                },
                {
                    id: "biz_reg_no",
                    label: displayBizRegLabel,
                    value: biz_info.biz_reg_no || "",
                    type: "text",
                    path: "biz_info.biz_reg_no",
                    errorKey: "biz_reg_no",
                },
                {
                    id: "business_document",
                    label: "사업자등록증",
                    value: biz_info.business_document?.name || "",
                    type: "file",
                    path: "biz_info.business_document",
                    errorKey: "business_document",
                },
            ],
        });
    }

    // 5) 계좌 정보
    const accountFields = [
        {
            id: "bank_name",
            label: "은행명",
            value: account_info.bank_name || "",
            type: "select",
            path: "account_info.bank_name",
            errorKey: "bank_name",
            options: KOREAN_BANKS.map((name) => ({ value: name, label: name })),
        },
        {
            id: "account_holder",
            label: "예금주",
            value: account_info.account_holder || "",
            type: "text",
            path: "account_info.account_holder",
            errorKey: "account_holder",
        },
        {
            id: "account_number",
            label: "계좌번호",
            value: account_info.account_number || "",
            type: "text",
            path: "account_info.account_number",
            errorKey: "account_number",
            fullWidth: true,
        },
        {
            id: "bank_document",
            label: "통장 사본",
            value: account_info.bank_document?.name || "",
            type: "file",
            path: "account_info.bank_document",
            errorKey: "bank_document",
        },
    ];

    if (isOverseas) {
        accountFields.push(
            {
                id: "swift_code",
                label: "SWIFT CODE",
                value: account_info.swift_code || "",
                type: "text",
                path: "account_info.swift_code",
                errorKey: "swift_code",
            },
            {
                id: "bank_address",
                label: "은행 주소",
                value: account_info.bank_address || "",
                type: "text",
                path: "account_info.bank_address",
                errorKey: "bank_address",
                fullWidth: true,
            }
        );
    }

    sections.push({
        id: "account_info",
        label: "계좌 정보",
        value: accountFields,
    });

    // 6) 세무 정보
    const TaxInfoSection = {
        id: "tax_info",
        label: "세무 정보",
        value: [
            {
                id: "invoice_type",
                label: "발행 유형",
                value: TAX_ISSUE_TYPE_LABEL[tax_info.invoice_type] || "",
                type: "radio",
                path: "tax_info.invoice_type",
                errorKey: "invoice_type",
                options: ISSUE_TYPES,
            },
        ],
    };

    const isPossibleSimpleTax = ["세금계산서", "전자계산서"].includes(
        TaxInfoSection.value[0].value
    );

    if (isPossibleSimpleTax) {
        TaxInfoSection.value.push({
            id: "is_simple_taxpayer",
            className: "bg-slate-50 p-6 mt-6",
            label: "간이과세자 여부",
            type: "checkbox",
            value: "",
            options: [
                {
                    id: "is_simple_taxpayer",
                    label: "간이과세자입니다.",
                    checked: !!tax_info.is_simple_taxpayer,
                    path: "tax_info.is_simple_taxpayer",
                },
            ],
            errorKey: "is_simple_taxpayer",
        });
    }

    sections.push(TaxInfoSection);
    return sections;
};

/**
 * 3) formData -> 제출용 FormData
 */
export const buildSubmitFormData = (formData) => {
    const fd = new FormData();

    const {
        basic_info,
        biz_type,
        personal_info,
        biz_info,
        account_info,
        tax_info,
    } = formData;

    const boolToText = (b) => String(!!b); // "true"/"false", API에서 Y/N로 변환

    // 공통 플래그
    fd.set("biz_type", biz_type.biz_type);

    // 개인 / 사업자 / 법인 분기
    if (biz_type.biz_type === BIZ_TYPES.INDIVIDUAL) {
        fd.set("is_overseas", boolToText(biz_type.is_overseas));
        fd.set("is_minor", boolToText(biz_type.is_minor));
        fd.set("is_foreigner", boolToText(biz_type.is_foreigner));
        fd.set("user_name", personal_info.user_name || "");

        if (!biz_type.is_foreigner) {
            fd.set("ssn", personal_info.ssn || "");
            fd.set(
                "identification_type",
                personal_info.identification_type || ""
            );
        } else {
            fd.set("ssn", personal_info.ssn || "");
            fd.set(
                "identification_type",
                personal_info.identification_type || "foreigner_card"
            );
        }

        if (biz_type.is_minor) {
            fd.set("guardian_name", personal_info.guardian_name || "");
            fd.set("guardian_tel", personal_info.guardian_tel || "");
        }
    } else if (biz_type.biz_type === BIZ_TYPES.SOLE_PROPRIETOR) {
        fd.set("biz_name", biz_info.biz_name || "");
        fd.set("biz_reg_no", biz_info.biz_reg_no || "");
    } else if (biz_type.biz_type === BIZ_TYPES.CORPORATE_BUSINESS) {
        fd.set("corp_name", biz_info.biz_name || "");
        fd.set("corp_reg_no", biz_info.biz_reg_no || "");
    }

    // 계좌 정보
    fd.set("bank_name", account_info.bank_name || "");
    fd.set("account_holder", account_info.account_holder || "");
    fd.set("account_number", account_info.account_number || "");

    if (biz_type.is_overseas) {
        fd.set("swift_code", account_info.swift_code || "");
        fd.set("bank_address", account_info.bank_address || "");
    }

    // 세무 정보
    fd.set("invoice_type", tax_info.invoice_type || "tax_invoice");
    fd.set("is_simple_taxpayer", boolToText(tax_info.is_simple_taxpayer));

    // consent_type (meta) — 실제 만료일과 무관, 사용자가 바꾼 값만 반영
    fd.set("consent_type", basic_info?.consent_type || "30days");

    // 파일 업로드 (새 파일이 있을 때만)
    const maybeAppendFile = (fieldName, v) => {
        const file =
            v instanceof File ? v : v?.file instanceof File ? v.file : null;

        if (file) fd.set(fieldName, file);
    };
    maybeAppendFile("id_document", personal_info.id_document);
    maybeAppendFile(
        "family_relation_certificate",
        personal_info.family_relation_certificate
    );
    maybeAppendFile("business_document", biz_info.business_document);
    maybeAppendFile("bank_document", account_info.bank_document);

    return fd;
};

/**
 * 폼 데이터 정규화:
 * - biz_type 변경 / is_minor, is_foreigner, is_overseas 토글에 맞춰
 *   불필요한 텍스트/파일 필드 초기화
 */
export const normalizePayeeEditFormData = (
    nextFormData,
    prevFormData = null
) => {
    if (!nextFormData) return nextFormData;

    const next = {
        ...nextFormData,
        basic_info: { ...nextFormData.basic_info },
        biz_type: { ...nextFormData.biz_type },
        personal_info: { ...nextFormData.personal_info },
        biz_info: { ...nextFormData.biz_info },
        account_info: { ...nextFormData.account_info },
        tax_info: { ...nextFormData.tax_info },
    };

    // 기본값 보정
    if (!next.basic_info?.consent_type) next.basic_info.consent_type = "30days";

    const bizType = next.biz_type?.biz_type;
    const isIndividual = bizType === BIZ_TYPES.INDIVIDUAL;

    const isMinor = !!next.biz_type?.is_minor;
    const isForeigner = !!next.biz_type?.is_foreigner;
    const isOverseas = !!next.biz_type?.is_overseas;

    // ✅ 해외거주 해제 시 해외 계좌 필드 초기화
    if (!isOverseas) {
        next.account_info.swift_code = "";
        next.account_info.bank_address = "";
    }

    // ✅ 개인이 아니면 개인 전용 플래그/필드/파일 정리
    if (!isIndividual) {
        next.biz_type.is_minor = false;
        next.biz_type.is_foreigner = false;

        next.personal_info.ssn = "";
        next.personal_info.identification_type = "";
        next.personal_info.id_document = {
            file: null,
            url: null,
            name: "",
            ext: "",
        };

        next.personal_info.guardian_name = "";
        next.personal_info.guardian_tel = "";
        next.personal_info.family_relation_certificate = {
            file: null,
            url: null,
            name: "",
            ext: "",
        };
    }

    // ✅ 개인일 때: 미성년자 토글 off면 법정대리인/가족관계증명서 초기화
    if (isIndividual && !isMinor) {
        next.personal_info.guardian_name = "";
        next.personal_info.guardian_tel = "";
        next.personal_info.family_relation_certificate = {
            file: null,
            url: null,
            name: "",
            ext: "",
        };
    }

    // ✅ 개인일 때: 외국인 토글 on/off에 따른 identification_type & 파일 초기화
    if (isIndividual) {
        if (isForeigner) {
            next.personal_info.identification_type = "foreigner_card";
            // 외국인 모드에서는 기존 id_document가 다른 타입일 수 있으니 UX 혼란 방지용 초기화(선택)
            // next.personal_info.id_document = { file: null, url: null, name: "", ext: "" };
        } else {
            if (next.personal_info.identification_type === "foreigner_card") {
                next.personal_info.identification_type = "";
            }
        }
    }

    // ✅ biz_type 전환 시 반대편 영역 값 제거 (캐시 방지)
    const prevBizType = prevFormData?.biz_type?.biz_type;
    const bizTypeChanged = prevBizType && prevBizType !== bizType;

    if (bizTypeChanged) {
        if (bizType === BIZ_TYPES.INDIVIDUAL) {
            next.biz_info.biz_name = "";
            next.biz_info.biz_reg_no = "";
            next.biz_info.business_document = {
                file: null,
                url: null,
                name: "",
                ext: "",
            };
        } else {
            // ✅ [추가] 개인 전용 플래그 전부 리셋 (사업자/법인에서는 의미 없음)
            next.biz_type.is_overseas = false;
            next.biz_type.is_minor = false;
            next.biz_type.is_foreigner = false;

            // ✅ [추가] 해외거주로 생긴 계좌 필드 리셋
            next.account_info.swift_code = "";
            next.account_info.bank_address = "";
            next.personal_info.ssn = "";
            next.personal_info.identification_type = "";
            next.personal_info.id_document = {
                file: null,
                url: null,
                name: "",
                ext: "",
            };
            next.personal_info.guardian_name = "";
            next.personal_info.guardian_tel = "";
            next.personal_info.family_relation_certificate = {
                file: null,
                url: null,
                name: "",
                ext: "",
            };
        }
    }
    const forceSimpleTaxFalseTypes = new Set(["cash_receipt", "individual"]);

    if (forceSimpleTaxFalseTypes.has(next.tax_info?.invoice_type)) {
        next.tax_info.is_simple_taxpayer = false;
    }

    return next;
};

/** 4) 통합 엔트리 */
export const formatPayeeInfoForEdit = (apiData) => {
    const rawFormData = mapApiToFormData(apiData || null);
    const formData = normalizePayeeEditFormData(rawFormData, null);
    const sections = buildEditSections(formData);
    return { formData, sections };
};
