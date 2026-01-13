import {
    BUSINESS_TYPE_LABEL,
    TAX_ISSUE_TYPE_LABEL,
    BIZ_TYPES,
} from "@/constants/payee-data";
import { IMG_URL } from "@/constants/dbConstants";

export const formatPayeeInfoForView = (apiData) => {
    const payeeInfo = apiData.payeeData;
    const files = apiData.files;

    const sections = [];
    const bizType = payeeInfo.biz_type;
    const isIndividual = bizType === BIZ_TYPES.INDIVIDUAL;
    const isSoleProp = bizType === BIZ_TYPES.SOLE_PROPRIETOR;
    const isCorp = bizType === BIZ_TYPES.CORPORATE_BUSINESS;
    const isSimpleTaxpayer = bizType === BIZ_TYPES.SIMPLE_TAXPAYER;
    const isTaxFreeBiz = bizType === BIZ_TYPES.TAX_FREE_BUSINESS;

    const isOverseas = payeeInfo?.is_overseas === "Y";
    const isMinor = payeeInfo.is_minor === "Y";
    const isForeigner = payeeInfo?.is_foreigner === "Y";

    // 2) 사업자 구분 (+ 발행 유형 + 특이사항)
    const bizTypeSection = {
        id: "biz_type",
        label: "사업자 구분",
        value: [
            {
                id: "biz_type",
                label: "사업자 구분",
                value: BUSINESS_TYPE_LABEL[bizType] || "-",
                type: "text",
            },
        ],
    };

    bizTypeSection.value.push({
        id: "invoice_type",
        label: "발행 유형",
        value: TAX_ISSUE_TYPE_LABEL[payeeInfo.invoice_type] || "",
        type: "text",
    });
    // 특이사항(해외거주자/외국인/미성년자) 묶기
    const specialNotesArr = [];
    if (isOverseas) specialNotesArr.push("해외거주자");
    if (isForeigner) specialNotesArr.push("외국인");
    if (isMinor) specialNotesArr.push("미성년자");
    const specialNotes =
        specialNotesArr.length > 0 ? specialNotesArr.join(", ") : "해당없음";

    // 개인 특이사항 체크박스
    if (isIndividual) {
        bizTypeSection.value.push({
            id: "biz_flags",
            label: "특이사항",
            type: "checkbox",
            value: specialNotes || "해당없음",
        });
    }

    sections.push(bizTypeSection);

    // 3) 개인 정보 (이름/연락처/이메일은 항상 출력 + readOnly)
    const personalFields = [
        {
            id: "user_name",
            label: "이름",
            value: payeeInfo?.user_name || "-",
            type: "text",
        },
        {
            id: "tel",
            label: "연락처",
            value: payeeInfo?.tel || "-",
            type: "text",
        },
        {
            id: "email",
            label: "이메일",
            value: payeeInfo?.email || "-",
            type: "text",
        },
    ];

    // 개인 전용 입력
    if (isIndividual) {
        personalFields.push({
            id: "ssn",
            label: isForeigner ? "외국인등록번호" : "주민등록번호",
            value: payeeInfo.ssn || "-",
            type: "text",
        });

        if (!isForeigner && !isMinor) {
            personalFields.push({
                id: "identification_type",
                label: "신분증 종류",
                value: payeeInfo.identification_type || "-",
                type: "radio",
            });
        }

        if (!isMinor) {
            personalFields.push({
                id: "id_document",
                label: isForeigner ? "외국인등록증" : "신분증 사본",
                value: files.id_document?.name || "-",
                type: "file",
                src: {
                    ext: files.id_document.ext,
                    name: files.id_document.name,
                    url: files.id_document.url.split("cr_console")[1],
                },
            });
        }

        if (isMinor) {
            personalFields.push(
                {
                    id: "guardian_name",
                    label: "법정대리인 본명",
                    value: payeeInfo.guardian_name || "-",
                    type: "text",
                },
                {
                    id: "guardian_tel",
                    label: "법정대리인 연락처",
                    value: payeeInfo.guardian_tel || "-",
                    type: "text",
                },
                {
                    id: "family_relation_certificate",
                    label: "가족관계증명서",
                    value: files.family_relation_certificate?.name || "-",
                    type: "file",
                    src: {
                        ext: files.family_relation_certificate.ext,
                        name: files.family_relation_certificate.name,
                        url: files.family_relation_certificate.url.split("cr_console")[1],
                    },
                }
            );
        }
    }

    sections.push({
        id: "personal_info",
        label: "개인 정보",
        value: personalFields,
    });

    // 4) 사업자 정보 (개인사업자/간이/면세/법인)
    if (isSoleProp || isCorp || isSimpleTaxpayer || isTaxFreeBiz) {
        sections.push({
            id: "biz_info",
            label: "사업자 정보",
            value: [
                {
                    id: "biz_name",
                    label: "사업자명",
                    value: payeeInfo.biz_name || "-",
                    type: "text",
                },
                {
                    id: "biz_reg_no",
                    label: "사업자등록번호",
                    value: payeeInfo.biz_reg_no || "-",
                    type: "text",
                },
                {
                    id: "business_document",
                    label: "사업자등록증",
                    value: files.business_document?.name || "-",
                    type: "file",
                    src: {
                        ext: files.business_document.ext,
                        name: files.business_document.name,
                        url: files.business_document.url.split("cr_console")[1],
                    },
                },
            ],
        });
    }

    // 5) 계좌 정보
    const accountFields = [
        {
            id: "bank_name",
            label: "은행명",
            value: payeeInfo?.bank_name || "-",
            type: "select",
        },
        {
            id: "account_holder",
            label: "예금주",
            value: payeeInfo?.account_holder || "-",
        },
        {
            id: "account_number",
            label: "계좌번호",
            value: payeeInfo?.account_number || "-",
            type: "text",
        },
        {
            id: "bank_document",
            label: "통장 사본",
            value: files?.bank_document?.name || "-",
            type: "file",
            src: {
                ext: files.bank_document.ext,
                name: files.bank_document.name,
                url: files.bank_document.url.split("cr_console")[1],
            },
        },
    ];

    if (isOverseas) {
        accountFields.push(
            {
                id: "swift_code",
                label: "SWIFT CODE",
                value: payeeInfo.swift_code || "-",
                type: "text",
            },
            {
                id: "bank_address",
                label: "은행 주소",
                value: payeeInfo.bank_address || "-",
                type: "text",
            }
        );
    }

    sections.push({
        id: "account_info",
        label: "계좌 정보",
        value: accountFields,
    });

    return sections;
};
