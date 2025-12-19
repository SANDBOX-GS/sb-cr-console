import {
  BUSINESS_TYPE_LABEL,
  ID_DOCUMENT_TYPE_LABEL,
  TAX_ISSUE_TYPE_LABEL,
} from "../constants/payee-data";
import { empty, getFileName } from "./formatters";

export const formatPayeeInfoForView = (apiData) => {
  if (!apiData?.payeeData) return [];

  const row = apiData.payeeData; // DB row (snake_case)
  const files = apiData.files || {};
  const metadata = apiData.metadata || {};

  const bizType = row.biz_type;
  const isIndividual = bizType === "individual";
  const isSoleProp = bizType === "sole_proprietor";
  const isCorp = bizType === "corporate_business";

  const isOverseas = row.is_overseas === "Y";
  const isForeigner = row.is_foreigner === "Y";
  const isMinor = row.is_minor === "Y";

  // 이름/사업자명 표시
  const displayName = isIndividual
    ? row.user_name
    : row.corp_name || row.biz_name || row.user_name;

  const displayBizLabel = isCorp ? "법인명" : "사업자명";
  const displayBizRegLabel = isCorp ? "법인등록번호" : "사업자등록번호";

  // 특이사항(해외거주자/외국인/미성년자) 묶기
  const specialNotesArr = [];
  if (isOverseas) specialNotesArr.push("해외거주자");
  if (isForeigner) specialNotesArr.push("외국인");
  if (isMinor) specialNotesArr.push("미성년자");
  const specialNotes =
    specialNotesArr.length > 0 ? specialNotesArr.join(", ") : "해당없음";

  const sections = [];

  // 1) 기본 정보
  sections.push({
    label: "기본 정보",
    id: "basic_info",
    value: [
      {
        label: "사업자 구분",
        id: "biz_type",
        value: BUSINESS_TYPE_LABEL[bizType] ?? "-",
      },
      {
        label: isIndividual ? "본명" : displayBizLabel,
        id: isIndividual ? "user_name" : "biz_name",
        value: empty(displayName),
      },
      {
        label: "특이사항",
        id: "special_notes",
        value: specialNotes,
      },
    ],
  });

  // 2) 개인 정보 (개인일 때만)
  if (isIndividual) {
    sections.push({
      label: "개인 정보",
      id: "personal_info",
      value: [
        {
          label: isForeigner ? "외국인등록번호" : "주민등록번호",
          id: "ssn",
          value: empty(row.ssn),
        },
        {
          label: "신분증 종류",
          id: "identification_type",
          value: ID_DOCUMENT_TYPE_LABEL[row.identification_type] ?? "-",
        },
        {
          label: "신분증",
          id: "id_document",
          value: getFileName(files.id_document),
        },
        // 미성년자인 개인일 경우 법정대리인 정보
        ...(isMinor
          ? [
              {
                label: "법정대리인 본명",
                id: "guardian_name",
                value: empty(row.guardian_name),
              },
              {
                label: "법정대리인 연락처",
                id: "guardian_tel",
                value: empty(row.guardian_tel),
              },
              {
                label: "가족관계증명서",
                id: "family_relation_certificate",
                value: getFileName(files.family_relation_certificate),
              },
            ]
          : []),
      ],
    });
  }

  // 3) 사업자 정보 (개인사업자/법인일 때)
  if (isSoleProp || isCorp) {
    sections.push({
      label: "사업자 정보",
      id: "business_info",
      value: [
        {
          label: displayBizLabel,
          id: "biz_name",
          value: empty(isCorp ? row.corp_name || row.biz_name : row.biz_name),
        },
        {
          label: displayBizRegLabel,
          id: "biz_reg_no",
          value: empty(
            isCorp ? row.corp_reg_no || row.biz_reg_no : row.biz_reg_no
          ),
        },
        {
          label: isSoleProp ? "사업자등록증" : "법인등록증",
          id: "business_document",
          value: getFileName(files.business_document),
        },
        ...(isMinor
          ? [
              {
                label: "법정대리인 본명",
                id: "guardian_name",
                value: empty(row.guardian_name),
              },
              {
                label: "법정대리인 연락처",
                id: "guardian_tel",
                value: empty(row.guardian_tel),
              },
              {
                label: "가족관계증명서",
                id: "family_relation_certificate",
                value: getFileName(files.family_relation_certificate),
              },
            ]
          : []),
      ],
    });
  }

  // 4) 계좌 정보
  sections.push({
    label: "계좌 정보",
    id: "account_info",
    value: [
      {
        label: "예금주",
        id: "account_holder",
        value: empty(row.account_holder),
      },
      {
        label: "계좌 번호",
        id: "account_number",
        value: empty(row.account_number),
      },
      {
        label: "은행명",
        id: "bank_name",
        value: empty(row.bank_name),
      },
      {
        label: "통장사본",
        id: "bank_document",
        value: getFileName(files.bank_document),
      },
    ],
  });
  // 5) 세무 정보
  sections.push({
    label: "세무 정보",
    id: "tax_info",
    value: [
      {
        label: "발행 유형",
        id: "invoice_type",
        value: TAX_ISSUE_TYPE_LABEL[row.invoice_type] ?? "-",
      },
      {
        label: "간이과세 여부",
        id: "is_simple_taxpayer",
        value: row.is_simple_taxpayer === "Y" ? "간이과세자" : "일반과세자",
      },
      {
        label: "정보 유효기간",
        id: "agree_expired_at",
        value: metadata.agree_expired_at
          ? new Date(metadata.agree_expired_at).toLocaleDateString("ko-KR")
          : "-",
      },
    ],
  });

  return sections;
};
