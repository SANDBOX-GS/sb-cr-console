"use client";
import { Box } from "@/components/common/Box";
import { Button } from "@/components/common/Button";
import InfoCard, { InfoEdit, InfoView } from "@/components/payee-info/InfoCard";
import { useRouter } from "@/hooks/useRouter";

export default function PayeeInfoViewPage() {
  const { navigate } = useRouter();
  const EXAMPLE = [
    {
      label: "기본 정보",
      id: "basic_info",
      value: [
        { label: "사업자구분", id: "biz_type", value: "개인" },
        { label: "본명", id: "recipient_name", value: "홍길동" },
        { label: "연락처", id: "phone_number", value: "010-1234-5678" },
        { label: "이메일", id: "email", value: "홍길동@example.com" },
      ],
    },
    {
      label: "개인 정보",
      id: "personal_info",
      value: [
        { label: "주민등록번호", id: "birth_date", value: "900101-1234567" },
        { label: "신분증 종류", id: "id_type", value: "운전면허증" },
        { label: "신분증", id: "id_file", value: "운전면허증.jpg" },
      ],
    },
    {
      label: "계좌 정보",
      id: "account_info",
      value: [
        {
          label: "예금주",
          id: "account_name",
          value: "김샌박",
        },
        {
          label: "계좌 번호",
          id: "account_number",
          value: "123-456-789012",
        },
        {
          label: "은행명",
          id: "bank_name",
          value: "신한은행",
        },
        {
          label: "통장사본",
          id: "bank_file",
          value: "통장사본.pdf",
        },
      ],
    },
    {
      label: "세무 정보",
      id: "personal_info",
      value: [
        { label: "발행 유형", id: "tax_type", value: "개인(사업 소득세 3.3%)" },
      ],
    },
  ];

  const ExpiryDateForm = () => {
    return (
      <Box className="bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-none">
        <form>
          <h4 className="mb-2">정산 정보 확인</h4>
          <InfoEdit
            type="radio"
            path="taxInfo.expiry_date"
            options={[
              {
                label: "30일간 동일한 정보로 정산 받겠습니다.",
                value: "30_days",
              },
              {
                label: "정산 시마다 수취 정보를 재확인하겠습니다.",
                value: "today_only",
              },
            ]}
            errorKey="expiry_date"
          ></InfoEdit>
          <Button className="mt-4 w-full" variant="primary" type="submit">
            유효기간 연장
          </Button>
        </form>
        <ul className="mt-6 mx-5 list-disc list-inside text-base text-slate-500">
          {[
            "정보 수집·갱신에 동의하거나 정보를 수정해 주세요.",
            "선택된 유효기간 동안 별도 알림 없이 저장된 수취정보로 정산금이 자동 지급됩니다.",
            "유효기간 만료 시 지급이 지연되거나 보류될 수 있습니다.",
          ].map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </Box>
    );
  };
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="w-full flex flex-col gap-6 md:max-w-[816px] mx-auto">
        <InfoCard
          title=" "
          mode="view"
          Info={[
            {
              label: "검토 상태",
              id: "tax_type",
              value: (
                <div className="flex gap-1 items-center">
                  <p>등록 완료</p>{" "}
                  <span className="inline-block ml-2 mb-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full border-yellow-200 border">
                    검수 중
                  </span>
                </div>
              ),
            },
            {
              label: "정보 수집 유효기간",
              id: "expiry_date",
              value: (
                <div className="flex gap-1 items-center">
                  <p>2026년 01월 05일</p>{" "}
                  <span className="inline-block ml-2 mb-1 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full border-yellow-200 border">
                    만료 임박
                  </span>
                </div>
              ),
            },
          ]}
          children={
            <>
              <ExpiryDateForm />
              <div className="flex items-center gap-2 border-t border-slate-200 my-2" />
              <div className="flex items-center gap-2 text-sm text-slate-500 justify-between w-full ">
                <p className="text-sm text-slate-700">최근 수정일시</p>
                <p className="text-sm text-slate-500">2024-01-05 14:23:45</p>
              </div>
            </>
          }
        ></InfoCard>
        {EXAMPLE?.map((info) => {
          return (
            <InfoCard title={info.label} mode="view" Info={info.value}>
              {console.log("페이지레벨", info.value)}
            </InfoCard>
          );
        })}
        <Button
          className="mx-auto mb-10 mt-4 w-[240px]"
          variant="secondary"
          onClick={() => navigate("/payee-info/edit")}
        >
          정보 수정
        </Button>
      </div>
    </div>
  );
}
