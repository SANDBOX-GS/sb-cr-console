"use client";
import { Box } from "@/components/common/Box";
import { Button } from "@/components/common/Button";
import InfoCard, { InfoEdit, InfoView } from "@/components/payee-info/InfoCard";
import { useRouter } from "@/hooks/useRouter";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { formatPayeeInfoForView } from "@/utils/formatPayeeInfoForView";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Loading from "@/app/loading";

export default function PayeeInfoViewPage() {
    const { navigate } = useRouter();
    const [apiData, setApiData] = useState({});
    const [viewData, setViewData] = useState([]);
    const [formData, setFormData] = useState({
        meta_data: { expired_option: "30days" },
    });
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { isLoggedIn, isLoading } = useAuth();
    const [metaData, setMetaData] = useState({});
    // 데이터를 불러오는 로직을 분리합니다.

    const [openById, setOpenById] = useState(() => ({
        basic_info: true, // 기본 정보는 항상 열림이면 true 고정해도 됨
        personal_info: false,
        account_info: false,
        tax_info: false,
    }));

    const toggleById = (id) => {
        setOpenById((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const fetchPayeeData = async () => {
        setIsPageLoading(true);

        try {
            const response = await fetch("/api/member/my_payee_info", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem(
                        "userToken"
                    )}`,
                },
            });

            if (!response.ok) {
                console.log("response", response);
                throw new Error("수취인 정보를 불러오는 데 실패했습니다.");
            }

            const data = await response.json();
            const row = data.payeeData;

            // 1) view model 생성 (InfoCard에서 사용하는 구조)
            if (row) {
                setViewData(formatPayeeInfoForView(data));
                console.log;
            } else {
                setViewData([]); // 아무 카드도 없게 만들기
            }
            // 2) 폼 초기값은 edit 모드에서만 사용할 수 있도록 남겨둠
            if (row) {
                // const normalized = mapPayeeRowToFormData(row);
                // setFormData(normalized);
            } else {
                // setFormData(INITIAL_PAYEE_FORM_DATA);
            }

            // 3) metadata 설정 (snake_case 키 기준)
            const meta = data.metadata || {};
            setMetaData(meta);
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error(`정보 로드 오류: ${error.message}`);

            setViewData([]);
        } finally {
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        // 1. 로딩 중이면 아무것도 하지 않음 (깜빡임 방지)
        if (isLoading) return;

        // 2. 인증되지 않았다면 리디렉션
        if (!isLoggedIn) {
            navigate("/login");
        } else {
            fetchPayeeData();
        }
    }, [isLoggedIn, isLoading, navigate]);

    // 로딩 중이거나 인증되지 않았다면 콘텐츠를 보여주지 않음
    if (isLoading || !isLoggedIn) {
        return <Loading />;
    }

    if (isPageLoading) {
        return (
            <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
        );
    }
    //   // 🚨 1. Metadata만 갱신하는 함수 정의
    //   const handleMetadataUpdate = async (newMetadata) => {
    //     if (!newMetadata) return;

    //     // isPageLoading을 잠시 true로 설정하는 대신, 로딩 상태는 InfoCallToAction에서 관리하므로
    //     // 여기서는 상태만 빠르게 업데이트합니다.

    //     setValidityStatus(newMetadata.validityStatus || "expired");
    //     setValidityPeriod({
    //       end: newMetadata.validityPeriodEnd || null,
    //     });
    //     // lastModified도 업데이트 (서버 응답에는 updated_at이 포함되어야 함)
    //     setLastModified(
    //       newMetadata.lastModified ? new Date(newMetadata.lastModified) : new Date()
    //     );

    //     // 이 함수는 PayeeData (originalData, formData)를 건드리지 않으므로,
    //     // 수정 중인 데이터가 보존됩니다.
    //   };

    /**
     * @param {'30days' | 'once' | null} type
     */
    const handleConsent = async (type) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        // 💡 실제 API 호출: /api/member/payee_agree
        try {
            const response = await fetch("/api/member/payee_agree", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "userToken"
                    )}`,
                },
                body: JSON.stringify({ consent_type: type }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // 성공 시 데이터 재로딩 (or 새로운 메타데이터로 상태 업데이트)
                toast.success("정보 수집에 성공적으로 동의했습니다.", {
                    duration: 3000,
                });
                // 🚨 성공 후 새로운 메타데이터로 상태를 직접 업데이트하거나,
                // 간단하게 전체 데이터를 다시 불러오도록 (fetchPayeeData) 호출할 수 있습니다.
                // 여기서는 페이지 새로고침 대신 간단히 상태만 업데이트했다고 가정하고,
                // InfoCallToAction에서 API 호출 후 데이터를 갱신하는 로직이 있다면 그를 따릅니다.
            } else {
                const errorMessage =
                    result.message ||
                    "정보 동의 처리에 실패했습니다. 다시 시도해 주세요.";
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("동의 API 호출 중 오류 발생:", error);
            toast.error(
                "서버 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해 주세요."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const ExpiryDateForm = () => {
        return (
            <Box className="w-full text-left bg-slate-50 border border-slate-200 rounded-lg p-4 shadow-none">
                <form>
                    <h4 className="mb-2">정산 정보 확인</h4>
                    <InfoEdit
                        type="radio"
                        path="meta_data.expired_option"
                        options={[
                            {
                                label: "30일간 동일한 정보로 정산 받겠습니다.",
                                value: "30days",
                            },
                            {
                                label: "정산 시마다 수취 정보를 재확인하겠습니다.",
                                value: "once",
                            },
                        ]}
                        errorKey="expired_option"
                        setFormData={setFormData}
                        formData={formData}
                        setErrors={setErrors}
                        errors={errors}
                    ></InfoEdit>
                    <Button
                        className="mt-4 w-full"
                        variant="primary"
                        type="button"
                        onClick={() =>
                            handleConsent(formData.meta_data.expired_option)
                        }
                    >
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
    console.log("metaData", metaData);
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="w-full flex flex-col gap-6 md:max-w-[816px] mx-auto">
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1>내정보 관리</h1>

                    <p className="mt-4 text-base text-slate-500 max-w-lg mx-auto">
                        유효기간이 만료된 경우 정산 일정이 변동될 수 있습니다.
                        <br /> 정산 정보는 언제든 변경할 수 있습니다.
                    </p>
                </motion.div>
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <InfoCard
                        title=""
                        isOpen={true}
                        mode="view"
                        Info={[
                            {
                                label: "검토 상태",
                                id: "tax_type",
                                value: (
                                    <div className="flex gap-1 items-center">
                                        <p>
                                            {metaData?.processed_at !== null ||
                                            metaData?.processed_at >
                                                metaData?.updated_at
                                                ? new Date(
                                                      metaData?.processed_at
                                                  ).toLocaleString("ko-KR")
                                                : "등록 완료"}
                                        </p>
                                        <span
                                            className={cn(
                                                "inline-block ml-2 mb-1 text-xs font-medium px-2.5 py-0.5 rounded-full",
                                                metaData?.processed_at !== null
                                                    ? "bg-sky-100 text-sky-600"
                                                    : metaData?.approval_status ===
                                                      "expired"
                                                    ? "bg-pink-100 text-pink-600"
                                                    : "bg-amber-100 text-amber-600"
                                            )}
                                        >
                                            {metaData?.approval_status ===
                                            "valid"
                                                ? "승인"
                                                : metaData?.approval_status ===
                                                  "expired"
                                                ? "수정 필요"
                                                : "검수 중"}
                                        </span>
                                    </div>
                                ),
                            },
                            {
                                label: "정보 수집 유효기간",
                                id: "agree_expired_at",
                                value: (
                                    <div className="flex gap-1 items-center">
                                        <p>
                                            {new Date(
                                                metaData?.agree_expired_at
                                            ).toLocaleString("ko-KR")}
                                        </p>
                                        <span
                                            className={cn(
                                                "inline-block ml-2 mb-1 text-xs font-medium px-2.5 py-0.5 rounded-full",
                                                metaData?.expired_status ===
                                                    "valid"
                                                    ? "bg-sky-100 text-sky-600"
                                                    : metaData?.expired_status ===
                                                      "expired"
                                                    ? "bg-pink-100 text-pink-600"
                                                    : "bg-amber-100 text-amber-600"
                                            )}
                                        >
                                            {metaData?.expired_status ===
                                            "valid"
                                                ? "유효"
                                                : metaData?.expired_status ===
                                                  "expired"
                                                ? "만료"
                                                : "만료 임박"}
                                        </span>
                                    </div>
                                ),
                            },
                        ]}
                        children={
                            <>
                                <motion.div
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    {metaData?.expired_status === "valid" ? (
                                        <></>
                                    ) : (
                                        <ExpiryDateForm />
                                    )}
                                    <div className="flex items-center gap-2 border-t border-slate-200 my-1 mb-2" />
                                    <div className="flex items-center gap-2 text-sm text-slate-500 justify-between w-full">
                                        <p className="text-sm text-slate-700">
                                            최근 수정일시
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {metaData?.updated_at
                                                ? new Date(
                                                      metaData.updated_at
                                                  ).toLocaleString("ko-KR")
                                                : "-"}
                                        </p>
                                    </div>
                                </motion.div>
                            </>
                        }
                        errorKey=""
                        setFormData={setFormData}
                        formData={formData}
                        setErrors={setErrors}
                        errors={errors}
                    ></InfoCard>
                </motion.div>
                {viewData?.map((info) => {
                    return (
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <InfoCard
                                title={info.label}
                                mode="view"
                                Info={info.value}
                                isToggle={info.id !== "basic_info"} // 기본정보는 토글 숨김
                                isOpen={openById[info.id] ?? false} // ✅ 박스별 open
                                onToggle={() => toggleById(info.id)}
                            ></InfoCard>
                        </motion.div>
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
