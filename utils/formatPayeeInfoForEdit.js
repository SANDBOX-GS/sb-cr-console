// utils/formatPayeeInfoForEdit.js
import {
  BUSINESS_TYPE_LABEL,
  ID_DOCUMENT_TYPES,
  TAX_ISSUE_TYPE_LABEL,
  ISSUE_TYPES,
  KOREAN_BANKS,
  CONSENT_TYPE,
  BIZ_TYPES,
} from "@/constants/payee-data"

/**
 * NOTE
 * - 프론트 formData는 블록 단위 객체
 *   basic_info / biz_type / personal_info / biz_info / account_info / biz_type
 * - 렌더링(InfoCard)은 sections 배열
 * - biz_type.invoice_type + biz_type.ratio 를 한 세트로 관리
 */

/** ISSUE_TYPES를 value로 빠르게 조회하기 위한 맵 */
const ISSUE_BY_VALUE = Object.fromEntries(
  (ISSUE_TYPES || []).map((it) => [it.value, it])
)

/** Y/N -> boolean */
const ynToBool = (v) => v === "Y"

/** invoice_type -> ratio 계산 (미정이면 0) */
const getRatioByInvoiceType = (invoiceType) => {
  const issue = ISSUE_BY_VALUE[invoiceType]
  return typeof issue?.taxRatio === "number" ? issue.taxRatio : 0
}

/**
 * biz_type(및 내부 플래그)에 따른 발행 유형 옵션 목록
 * - 인덱스 접근 금지 (ISSUE_TYPES[n])
 * - 반드시 value 기반
 */
const getIssueOptionsByBizType = ({ bizType }) => {
  // payee-data.js의 ISSUE_TYPES value를 기준으로 구성하세요.
  // 아래는 현재 파일의 기존 로직(ISSUE_TYPES[0..4])를 value 기반으로 치환한 형태입니다.
  // - individual: ISSUE_TYPES[4]
  // - sole_proprietor/simple_taxpayer: ISSUE_TYPES[2], [3], [0]
  // - tax_free_business: ISSUE_TYPES[1]
  // - corporate_business: ISSUE_TYPES[0]

  const safePick = (values) =>
    (values || []).map((v) => ISSUE_BY_VALUE[v]).filter(Boolean)

  if (bizType === BIZ_TYPES.INDIVIDUAL) {
    return safePick([ISSUE_TYPES?.[4]?.value].filter(Boolean))
  }

  if (
    bizType === BIZ_TYPES.SOLE_PROPRIETOR ||
    bizType === BIZ_TYPES.SIMPLE_TAXPAYER
  ) {
    return safePick(
      [
        ISSUE_TYPES?.[2]?.value,
        ISSUE_TYPES?.[3]?.value,
        ISSUE_TYPES?.[0]?.value,
      ].filter(Boolean)
    )
  }

  if (bizType === BIZ_TYPES.TAX_FREE_BUSINESS) {
    return safePick([ISSUE_TYPES?.[1]?.value].filter(Boolean))
  }

  if (bizType === BIZ_TYPES.CORPORATE_BUSINESS) {
    return safePick([ISSUE_TYPES?.[0]?.value].filter(Boolean))
  }

  // fallback
  return (ISSUE_TYPES || []).filter(Boolean)
}

/**
 * edit 페이지 formData 기본 구조
 * - consent_type은 항상 30days로 시작
 */
export const createInitialFormData = () => ({
  basic_info: {
    consent_type: "30days",
  },
  biz_type: {
    biz_type: BIZ_TYPES.INDIVIDUAL,
    invoice_type: ISSUE_TYPES?.[0]?.value || "tax_invoice",
    tax: 0,
    is_overseas: false,
    is_minor: false,
    is_foreigner: false,
  },
  personal_info: {
    user_name: "",
    tel: "",
    email: "",

    // 개인 전용
    ssn: "",
    identification_type: "",
    id_document: { file: null, url: null, name: "", ext: "" },

    // 미성년자
    guardian_name: "",
    guardian_tel: "",
    family_relation_certificate: { file: null, url: null, name: "", ext: "" },
  },
  biz_info: {
    biz_name: "",
    biz_reg_no: "",
    business_document: { file: null, url: null, name: "", ext: "" },
  },
  account_info: {
    bank_name: "",
    account_holder: "",
    account_number: "",
    swift_code: "",
    bank_address: "",
    bank_document: { file: null, url: null, name: "", ext: "" },
  },
})

/** 1) API 응답 -> formData 매핑 */
export const mapApiToFormData = (apiData) => {
  const row = apiData?.payeeData || null
  const apiFiles = apiData?.files || {}

  const base = createInitialFormData()
  if (!row) return base

  const bizType = row.biz_type || base.biz_type.biz_type
  const isOverseas = ynToBool(row.is_overseas)
  const isMinor = ynToBool(row.is_minor)
  const isForeigner = ynToBool(row.is_foreigner)

  const next = {
    ...base,
    basic_info: {
      ...base.basic_info,
      // 서버 메타와 무관하게 항상 30days
      consent_type: "30days",
    },
    biz_type: {
      ...base.biz_type,
      biz_type: bizType,

      invoice_type: row.invoice_type || base.biz_type.invoice_type,
      // ratio는 서버가 주더라도 프론트는 invoice_type 기준으로 계산해도 되고,
      // 서버 ratio 컬럼을 추가하면 여기서 row.ratio를 우선 적용해도 됩니다.
      tax:
        typeof row.tax === "number"
          ? row.tax
          : getRatioByInvoiceType(
              row.invoice_type || base.biz_type.invoice_type
            ),
      // 개인일 때만 사용되는 플래그들이지만, 초기 매핑은 일단 반영
      is_overseas: bizType === BIZ_TYPES.INDIVIDUAL ? isOverseas : false,
      is_minor: bizType === BIZ_TYPES.INDIVIDUAL ? isMinor : false,
      is_foreigner: bizType === BIZ_TYPES.INDIVIDUAL ? isForeigner : false,
    },
    personal_info: {
      ...base.personal_info,
      // 이름/연락처/이메일은 bizType과 무관하게 항상 렌더링(읽기전용)
      user_name: row.user_name || "",
      tel: row.tel || "",
      email: row.email || "",
    },
    biz_info: { ...base.biz_info },
    account_info: {
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
    },
  }

  // 개인 전용 값 매핑
  if (bizType === BIZ_TYPES.INDIVIDUAL) {
    next.personal_info.ssn = row.ssn || ""
    next.personal_info.identification_type =
      row.identification_type || (isForeigner ? "foreigner_card" : "")

    if (isMinor) {
      next.personal_info.guardian_name = row.guardian_name || ""
      next.personal_info.guardian_tel = row.guardian_tel || ""
    }

    next.personal_info.id_document = {
      ...base.personal_info.id_document,
      url: apiFiles.id_document?.url || null,
      name: apiFiles.id_document?.name || "",
      ext: apiFiles.id_document?.ext || "",
    }

    next.personal_info.family_relation_certificate = {
      ...base.personal_info.family_relation_certificate,
      url: apiFiles.family_relation_certificate?.url || null,
      name: apiFiles.family_relation_certificate?.name || "",
      ext: apiFiles.family_relation_certificate?.ext || "",
    }
  }

  // 사업자/법인 전용 값 매핑
  if (
    bizType === BIZ_TYPES.SOLE_PROPRIETOR ||
    bizType === BIZ_TYPES.SIMPLE_TAXPAYER ||
    bizType === BIZ_TYPES.TAX_FREE_BUSINESS ||
    bizType === BIZ_TYPES.CORPORATE_BUSINESS
  ) {
    next.biz_info.biz_name = row.biz_name || row.corp_name || ""
    next.biz_info.biz_reg_no = row.biz_reg_no || row.corp_reg_no || ""
    next.biz_info.business_document = {
      ...base.biz_info.business_document,
      url: apiFiles.business_document?.url || null,
      name: apiFiles.business_document?.name || "",
      ext: apiFiles.business_document?.ext || "",
    }
  }

  // 해외거주 계좌 필드
  if (next.biz_type.is_overseas) {
    next.account_info.swift_code = row.swift_code || ""
    next.account_info.bank_address = row.bank_address || ""
  }

  // invoice_type 기준 ratio 재보정 (옵션 변경/상수 변경에 안전)
  next.biz_type.tax = getRatioByInvoiceType(next.biz_type.invoice_type)

  return next
}

/**
 * 2) formData -> InfoCard 섹션 배열
 */
export const buildEditSections = (formData) => {
  const { basic_info, biz_type, personal_info, biz_info, account_info } =
    formData

  const sections = []

  const bizType = biz_type.biz_type
  const isIndividual = bizType === BIZ_TYPES.INDIVIDUAL
  const isSoleProp = bizType === BIZ_TYPES.SOLE_PROPRIETOR
  const isCorp = bizType === BIZ_TYPES.CORPORATE_BUSINESS
  const isSimpleTaxpayer = bizType === BIZ_TYPES.SIMPLE_TAXPAYER
  const isTaxFreeBiz = bizType === BIZ_TYPES.TAX_FREE_BUSINESS

  const isOverseas = !!biz_type.is_overseas
  const isMinor = !!biz_type.is_minor
  const isForeigner = !!biz_type.is_foreigner

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
  })

  // 2) 사업자 구분 (+ 발행 유형 + 특이사항)
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
            value: BIZ_TYPES.SIMPLE_TAXPAYER,
            label: BUSINESS_TYPE_LABEL[BIZ_TYPES.SIMPLE_TAXPAYER],
          },
          {
            value: BIZ_TYPES.TAX_FREE_BUSINESS,
            label: BUSINESS_TYPE_LABEL[BIZ_TYPES.TAX_FREE_BUSINESS],
          },
          {
            value: BIZ_TYPES.CORPORATE_BUSINESS,
            label: BUSINESS_TYPE_LABEL[BIZ_TYPES.CORPORATE_BUSINESS],
          },
        ].filter((o) => o.label),
      },
    ],
  }

  // 발행 유형 (bizType별 옵션)
  const issueOptions = getIssueOptionsByBizType({ bizType }).map((it) => ({
    value: it.value,
    label: it.label,
    description: it.description,
    detail: it.detail,
    taxRatio: it.taxRatio,
  }))

  bizTypeSection.value.push({
    id: "invoice_type",
    label: "발행 유형",
    value: TAX_ISSUE_TYPE_LABEL[biz_type.invoice_type] || "",
    type: "radio",
    path: "biz_type.invoice_type",
    errorKey: "invoice_type",
    options: issueOptions,
  })

  // 개인 특이사항 체크박스
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
          checked: isOverseas,
          path: "biz_type.is_overseas",
        },
        {
          id: "is_minor",
          label: "미성년자",
          checked: isMinor,
          path: "biz_type.is_minor",
        },
        {
          id: "is_foreigner",
          label: "외국인",
          checked: isForeigner,
          path: "biz_type.is_foreigner",
        },
      ],
    })
  }

  sections.push(bizTypeSection)

  // 3) 개인 정보 (이름/연락처/이메일은 항상 출력 + readOnly)
  const personalFields = [
    {
      id: "user_name",
      label: "이름",
      value: personal_info.user_name,
      type: "text",
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
  ]

  // 개인 전용 입력
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
    })

    if (!isForeigner && !isMinor) {
      personalFields.push({
        id: "identification_type",
        label: "신분증 종류",
        value: personal_info.identification_type || "",
        type: "radio",
        path: "personal_info.identification_type",
        errorKey: "identification_type",
        options: ID_DOCUMENT_TYPES,
      })
    }

    if (!isMinor) {
      personalFields.push({
        id: "id_document",
        label: isForeigner ? "외국인등록증" : "신분증 사본",
        value: personal_info.id_document?.name || "",
        type: "file",
        path: "personal_info.id_document",
        errorKey: "id_document",
      })
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
          value: personal_info.family_relation_certificate?.name || "",
          type: "file",
          path: "personal_info.family_relation_certificate",
          errorKey: "family_relation_certificate",
        }
      )
    }
  }

  sections.push({
    id: "personal_info",
    label: "개인 정보",
    value: personalFields,
  })

  // 4) 사업자 정보 (개인사업자/간이/면세/법인)
  if (isSoleProp || isCorp || isSimpleTaxpayer || isTaxFreeBiz) {
    const displayBizLabel = isCorp ? "법인명" : "상호명"
    const displayBizRegLabel = isCorp ? "법인등록번호" : "사업자등록번호"

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
    })
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
  ]

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
    )
  }

  sections.push({
    id: "account_info",
    label: "계좌 정보",
    value: accountFields,
  })

  return sections
}

/**
 * 3) formData -> 제출용 FormData
 * - invoice_type + ratio 같이 전송
 */
export const buildSubmitFormData = (formData) => {
  const fd = new FormData()

  const { basic_info, biz_type, personal_info, biz_info, account_info } =
    formData

  const boolToText = (b) => String(!!b) // "true"/"false", API에서 Y/N로 변환

  // 공통
  fd.set("biz_type", biz_type.biz_type)

  // 세무 정보 (invoice_type + ratio)
  fd.set("invoice_type", biz_type.invoice_type || "")
  fd.set("tax", String(biz_type.tax ?? 0))
  // 개인 플래그 (개인일 때만)
  if (biz_type.biz_type === BIZ_TYPES.INDIVIDUAL) {
    fd.set("is_overseas", boolToText(biz_type.is_overseas))
    fd.set("is_minor", boolToText(biz_type.is_minor))
    fd.set("is_foreigner", boolToText(biz_type.is_foreigner))

    fd.set("user_name", personal_info.user_name || "")
    fd.set("ssn", personal_info.ssn || "")

    if (!biz_type.is_foreigner) {
      fd.set("identification_type", personal_info.identification_type || "")
    } else {
      fd.set(
        "identification_type",
        personal_info.identification_type || "foreigner_card"
      )
    }

    if (biz_type.is_minor) {
      fd.set("guardian_name", personal_info.guardian_name || "")
      fd.set("guardian_tel", personal_info.guardian_tel || "")
    }
  } else {
    // 사업자/법인
    fd.set("biz_name", biz_info.biz_name || "")
    fd.set("biz_reg_no", biz_info.biz_reg_no || "")
  }

  // 계좌 정보
  fd.set("bank_name", account_info.bank_name || "")
  fd.set("account_holder", account_info.account_holder || "")
  fd.set("account_number", account_info.account_number || "")

  if (biz_type.is_overseas) {
    fd.set("swift_code", account_info.swift_code || "")
    fd.set("bank_address", account_info.bank_address || "")
  }

  // consent_type (meta) — 실제 만료일과 무관, 사용자가 바꾼 값만 반영
  fd.set("consent_type", basic_info?.consent_type || "30days")

  // 파일 업로드 (새 파일이 있을 때만)
  const maybeAppendFile = (fieldName, v) => {
    const file = v instanceof File ? v : v?.file instanceof File ? v.file : null
    if (file) fd.set(fieldName, file)
  }

  maybeAppendFile("id_document", personal_info.id_document)
  maybeAppendFile(
    "family_relation_certificate",
    personal_info.family_relation_certificate
  )
  maybeAppendFile("business_document", biz_info.business_document)
  maybeAppendFile("bank_document", account_info.bank_document)

  return fd
}

/**
 * 폼 데이터 정규화:
 * - biz_type 변경 / is_minor, is_foreigner, is_overseas 토글에 맞춰
 *   불필요한 텍스트/파일 필드 초기화
 * - invoice_type 변경 시 ratio 자동 동기화
 */
export const normalizePayeeEditFormData = (
  nextFormData,
  prevFormData = null
) => {
  if (!nextFormData) return nextFormData

  const next = {
    ...nextFormData,
    basic_info: { ...nextFormData.basic_info },
    biz_type: { ...nextFormData.biz_type },
    personal_info: { ...nextFormData.personal_info },
    biz_info: { ...nextFormData.biz_info },
    account_info: { ...nextFormData.account_info },
  }

  // 기본값 보정
  if (!next.basic_info?.consent_type) next.basic_info.consent_type = "30days"

  const bizType = next.biz_type?.biz_type
  const isIndividual = bizType === BIZ_TYPES.INDIVIDUAL

  const isMinor = !!next.biz_type?.is_minor
  const isForeigner = !!next.biz_type?.is_foreigner
  const isOverseas = !!next.biz_type?.is_overseas

  // ✅ invoice_type 누락/이상치 보정 + ratio 동기화
  if (!next.biz_type?.invoice_type) {
    const allowed = getIssueOptionsByBizType({ bizType })
    next.biz_type.invoice_type =
      allowed?.[0]?.value || ISSUE_TYPES?.[0]?.value || "tax_invoice"
  }
  if (typeof next.biz_type?.tax !== "number") {
    next.biz_type.tax = getRatioByInvoiceType(next.biz_type.invoice_type)
  }

  // ✅ 해외거주 해제 시 해외 계좌 필드 초기화
  if (!isOverseas) {
    next.account_info.swift_code = ""
    next.account_info.bank_address = ""
  }

  // ✅ 개인이 아니면 개인 전용 플래그/필드/파일 정리 + 해외 플래그까지 리셋
  if (!isIndividual) {
    next.biz_type.is_overseas = false
    next.biz_type.is_minor = false
    next.biz_type.is_foreigner = false

    next.personal_info.ssn = ""
    next.personal_info.identification_type = ""
    next.personal_info.id_document = {
      file: null,
      url: null,
      name: "",
      ext: "",
    }

    next.personal_info.guardian_name = ""
    next.personal_info.guardian_tel = ""
    next.personal_info.family_relation_certificate = {
      file: null,
      url: null,
      name: "",
      ext: "",
    }

    // 개인에서 파생된 해외 계좌 필드까지 확실히 제거
    next.account_info.swift_code = ""
    next.account_info.bank_address = ""
  }

  // ✅ 개인일 때: 미성년자 토글 off면 법정대리인/가족관계증명서 초기화
  if (isIndividual && !isMinor) {
    next.personal_info.guardian_name = ""
    next.personal_info.guardian_tel = ""
    next.personal_info.family_relation_certificate = {
      file: null,
      url: null,
      name: "",
      ext: "",
    }
  }

  // ✅ 개인일 때: 외국인 토글 on/off에 따른 identification_type 보정
  if (isIndividual) {
    if (isForeigner) {
      next.personal_info.identification_type = "foreigner_card"
    } else {
      if (next.personal_info.identification_type === "foreigner_card") {
        next.personal_info.identification_type = ""
      }
    }
  }

  // ✅ invoice_type 변경 시 ratio 동기화 (prev 대비)
  const prevInvoiceType = prevFormData?.biz_type?.invoice_type
  const nextInvoiceType = next.biz_type?.invoice_type
  if (prevInvoiceType && prevInvoiceType !== nextInvoiceType) {
    next.biz_type.tax = getRatioByInvoiceType(nextInvoiceType)
  }

  // ✅ biz_type 변경 시 invoice_type이 허용 범위 밖이면 첫 옵션으로 강제
  const prevBizType = prevFormData?.biz_type?.biz_type
  if (prevBizType && prevBizType !== bizType) {
    const allowed = getIssueOptionsByBizType({ bizType })
    const allowedValues = new Set((allowed || []).map((it) => it.value))
    if (!allowedValues.has(next.biz_type.invoice_type)) {
      next.biz_type.invoice_type =
        allowed?.[0]?.value || next.biz_type.invoice_type
      next.biz_type.tax = getRatioByInvoiceType(next.biz_type.invoice_type)
    }
  }

  return next
}

/** 4) 통합 엔트리 */
export const formatPayeeInfoForEdit = (apiData) => {
  const rawFormData = mapApiToFormData(apiData || null)
  const formData = normalizePayeeEditFormData(rawFormData, null)
  const sections = buildEditSections(formData)
  return { formData, sections }
}
