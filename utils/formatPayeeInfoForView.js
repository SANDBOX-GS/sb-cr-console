import {
  BUSINESS_TYPE_LABEL,
  ID_DOCUMENT_TYPE_LABEL,
  TAX_ISSUE_TYPE_LABEL,
} from "./payeeLabel";
import { empty, getFileName } from "./formatters";

export const formatPayeeInfoForView = (apiData) => {
  if (!apiData?.payeeData) return [];

  const { recipientInfo, accountInfo, taxInfo } = apiData.payeeData;
  const { metadata } = apiData;

  return [
    {
      label: "기본 정보",
      id: "basic_info",
      value: [
        {
          label: "사업자 구분",
          id: "business_type",
          value: BUSINESS_TYPE_LABEL[recipientInfo.businessType] ?? "-",
        },
        {
          label: "본명",
          id: "real_name",
          value: empty(recipientInfo.realName),
        },
      ],
    },

    {
      label: "개인 정보",
      id: "personal_info",
      value: [
        {
          label: "주민등록번호",
          id: "id_number",
          value: empty(recipientInfo.idNumber),
        },
        {
          label: "신분증 종류",
          id: "id_document_type",
          value: ID_DOCUMENT_TYPE_LABEL[recipientInfo.idDocumentType] ?? "-",
        },
        {
          label: "신분증",
          id: "id_document",
          value: getFileName(recipientInfo.idDocument),
        },
      ],
    },

    {
      label: "계좌 정보",
      id: "account_info",
      value: [
        {
          label: "예금주",
          id: "account_holder",
          value: empty(accountInfo.accountHolder),
        },
        {
          label: "계좌 번호",
          id: "account_number",
          value: empty(accountInfo.accountNumber),
        },
        {
          label: "은행명",
          id: "bank_name",
          value: empty(accountInfo.bankName),
        },
        {
          label: "통장사본",
          id: "bank_document",
          value: getFileName(accountInfo.bankDocument),
        },
      ],
    },

    {
      label: "세무 정보",
      id: "tax_info",
      value: [
        {
          label: "발행 유형",
          id: "issue_type",
          value: TAX_ISSUE_TYPE_LABEL[taxInfo.issueType] ?? "-",
        },
        {
          label: "과세 유형",
          id: "income_type",
          value:
            taxInfo.incomeType === "business"
              ? "사업소득"
              : taxInfo.incomeType === "other"
              ? "기타소득"
              : "-",
        },
        {
          label: "간이과세 여부",
          id: "is_simple_tax",
          value: taxInfo.isSimpleTax ? "간이과세자" : "일반과세자",
        },
      ],
    },
  ];
};
