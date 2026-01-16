"use client";
import {useState, useEffect} from "react";
import {useSearchParams} from "next/navigation";
import {Button} from "@/components/common/Button";
import {Box} from "@/components/common/Box";
import {Input} from "@/components/ui/input";
import {NOTION_PAGE_ID} from "@/constants/dbConstants";
import {cn} from "@/components/ui/utils";
import {EyeIcon, EyeOffIcon, ChevronDownIcon} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {useRouter} from "@/hooks/useRouter";
import {IconCard} from "@/components/common/IconCard";
import {ShieldProtect} from "@/components/icon/ShieldProtect";
import {CheckCircleActive} from "@/components/icon/CheckCircleActive";
import {CheckCircle} from "@/components/icon/CheckCircle";
import Loading from "../loading";
import {Dialog, DialogTrigger, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import NotionModalContents from "@/components/common/NotionModalContents";
import {ExternalLinkIcon} from "lucide-react";
import {toast} from "sonner";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndecator";
import {validateEmail, handleRedirect, validatePassword} from "@/lib/utils";

export default function App() {
    const {navigate} = useRouter();
    const searchParams = useSearchParams(); // URL 파라미터 가져오기
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        agreements: {
            all: false,
            terms: false,
            privacy: false,
            thirdParty: false,
            marketing: false,
        },
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 검증 관련 State
    const [isVerifying, setIsVerifying] = useState(true); // 검증 로딩 상태

    // 약관 토글 상태 관리
    const [expandedAllTerms, setExpandedAllTerms] = useState(false);

    // [수정된 로직] 컴포넌트 마운트 시 URL 파라미터 검증
    useEffect(() => {
        const verifyToken = async () => {
            const token = searchParams.get("code");

            // 1. 토큰(code)이 아예 없는 경우 -> 메인(/)으로 이동
            if (!token) {
                handleRedirect("유효하지 않은 접근입니다.", "/");
                return;
            }

            try {
                const response = await fetch("/api/member/check_code", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({code: token}),
                });

                // 백엔드에서 보내준 에러 메시지를 활용하기 위해 json 파싱
                const data = await response.json();

                if (response.ok) {
                    // [200 OK] 정상: 로딩 끄고 가입 폼 등장
                    setIsVerifying(false);
                } else if (response.status === 409) {
                    // [409 Conflict] 이미 가입된 계정 -> 로그인(/login)으로 이동
                    // 백엔드 메시지: "이미 등록된 계정입니다. 로그인해 주세요."
                    handleRedirect(data.message, "/login");
                } else {
                    // [404 Not Found] 유효하지 않은 코드 -> 메인(/)으로 이동
                    // 백엔드 메시지: "접속 코드가 유효하지 않습니다..."
                    handleRedirect(data.message || "유효하지 않은 링크입니다.", "/");
                }
            } catch (error) {
                console.error("Token verification failed:", error);
                // 서버 에러 등 예외 발생 시 -> 메인(/)으로 이동
                handleRedirect("서버 오류가 발생했습니다. 관리자에게 문의해주세요.", "/");
            }
        };

        verifyToken();
    }, [searchParams, navigate]);

    // [화면 1] 검증 중일 때 로딩 화면
    if (isVerifying) {
        return <Loading/>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const newErrors = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = "이메일을 입력해 주세요.";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "올바른 이메일 형식을 입력해 주세요.";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "비밀번호를 입력해 주세요.";
        } else {
            const passwordError = validatePassword(formData.password);
            if (passwordError) {
                newErrors.password = passwordError;
            }
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "비밀번호 확인을 입력해 주세요.";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "비밀번호와 일치하지 않습니다.";
        }

        // Required agreements validation
        if (
            !formData.agreements.terms ||
            !formData.agreements.privacy
            // !formData.agreements.thirdParty // (만약 thirdParty가 필수가 아니라면 제거, 필수라면 유지)
        ) {
            newErrors.agreements = "필수 항목에 동의해 주세요.";

            // 에러가 있으면 약관 토글을 강제로 엽니다.
            setExpandedAllTerms(true);
        }
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                const code = searchParams.get("code");

                const response = await fetch("/api/member/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        code: code,
                        email: formData.email,
                        password: formData.password,
                        agreed_to_terms: formData.agreements.terms ? "Y" : "N",
                        agreed_to_privacy: formData.agreements.privacy ? "Y" : "N",
                        agreed_to_third_party: "N",
                        agreed_to_marketing: formData.agreements.marketing ? "Y" : "N",
                    }),
                });

                if (response.ok) {
                    navigate("/login", {});
                    toast.success("계정 등록이 완료되었습니다.");
                } else {
                    const errorData = await response.json();
                    console.error("회원가입 실패:", errorData);
                    toast.error(errorData.message); // 사용자에게 실패 메시지 표시
                }
            } catch (error) {
                console.error("API 호출 중 오류 발생:", error);
                toast.error("네트워크 오류가 발생했습니다."); // 네트워크 오류 메시지 표시
            }
        }

        setIsLoading(false);
    };

    const handleAgreementChange = (key, checked) => {
        if (key === "all") {
            setFormData((prev) => ({
                ...prev,
                agreements: {
                    all: checked,
                    terms: checked,
                    privacy: checked,
                    thirdParty: checked,
                    marketing: checked,
                },
            }));
        } else {
            const newAgreements = {...formData.agreements, [key]: checked};
            const allRequired =
                newAgreements.terms &&
                newAgreements.privacy &&
                newAgreements.thirdParty;
            newAgreements.all = allRequired && newAgreements.marketing;

            setFormData((prev) => ({
                ...prev,
                agreements: newAgreements,
            }));
        }

        // Clear agreement errors when user checks required items
        if (
            errors.agreements &&
            (formData.agreements.terms ||
                formData.agreements.privacy ||
                formData.agreements.thirdParty)
        ) {
            setErrors((prev) => ({...prev, agreements: undefined}));
        }
    };

    const toggleAllTerms = (e) => {
        e.preventDefault(); // 기본 동작 방지
        e.stopPropagation(); // 이벤트 버블링 방지
        setExpandedAllTerms((prev) => !prev); // true <-> false 반전
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-start w-full max-w-[816px] mx-auto">
            <motion.div
                initial={{y: 30, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.6}}
                className="text-center mb-12"
            >
                <h1>
                    샌드박스 크리에이터
                    <br/> 정산 시스템
                </h1>
            </motion.div>
            <IconCard
                h="정산 시스템이 처음이신가요?"
                infoTitle="샌드박스와 함께해 주신 협업 파트너 여러분을 환영합니다."
                infoLi={[
                    "안내 이메일을 받으신 이메일 주소로 로그인 계정을 등록할 수 있습니다.",
                    "로그인 계정 등록 후 수취 정보 등록을 이어서 진행해 주세요.",
                ]}
                desc={[
                    "※ 수취정보가 기한 내 등록되지 않을 경우 정산금 지급 일정이 변동될 수 있습니다.",
                ]}
                icon={ShieldProtect}
            />
            <motion.form
                initial={{y: 30, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.6, delay: 0.2}}
                onSubmit={handleSubmit}
                className="w-full"
            >
                <Box className="mb-10">
                    <div className="space-y-8 relative">
                        {/* Email Section */}
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{delay: 0.3}}
                            className="space-y-3"
                        >
                            <h4 className="mb-4">샌드박스 수취인 계정 등록</h4>
                            <label className="font-medium text-sm md:text-base">
                                로그인 계정
                            </label>
                            <p className="text-slate-600">
                                이메일을 수신한 이메일 주소를 입력해 주세요.
                            </p>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="이메일"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            email: e.target.value,
                                        }));
                                        if (errors.email)
                                            setErrors((prev) => ({
                                                ...prev,
                                                email: undefined,
                                            }));
                                    }}
                                    className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all duration-200 ${
                                        errors.email
                                            ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                                            : ""
                                    }`}
                                />
                                <AnimatePresence>
                                    {errors.email && (
                                        <motion.p
                                            initial={{opacity: 0, y: -10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className="text-red-500 text-sm mt-2 flex items-center gap-1"
                                        >
                                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                            {errors.email}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* Password Section */}
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{delay: 0.4}}
                            className="space-y-3"
                        >
                            <label className="font-medium text-sm md:text-base">
                                비밀번호 등록 및 계정 활성화
                            </label>

                            <div className="space-y-4">
                                {/* Password Input */}
                                <div className="relative">
                                    <Input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="비밀번호"
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }));
                                            if (errors.password)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    password: undefined,
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all duration-200 pr-12 ${
                                            errors.password
                                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                                                : ""
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                    >
                                        {showPassword ? (
                                            <EyeIcon className="h-5 w-5"/>
                                        ) : (
                                            <EyeOffIcon className="h-5 w-5"/>
                                        )}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator
                                    password={formData.password}
                                />

                                <AnimatePresence>
                                    {errors.password && (
                                        <motion.p
                                            initial={{opacity: 0, y: -10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className="text-red-500 text-sm mt-2 flex items-center gap-1"
                                        >
                                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                            {errors.password}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                                {/* Confirm Password Input */}
                                <div className="relative">
                                    <Input
                                        type={
                                            showConfirmPassword ? "text" : "password"
                                        }
                                        placeholder="비밀번호 확인"
                                        value={formData.confirmPassword}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                confirmPassword: e.target.value,
                                            }));
                                            if (errors.confirmPassword)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    confirmPassword: undefined,
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all duration-200 pr-12 ${
                                            errors.confirmPassword
                                                ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                                                : ""
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeIcon className="h-5 w-5"/>
                                        ) : (
                                            <EyeOffIcon className="h-5 w-5"/>
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -10}}
                                        className="text-red-500 text-sm mt-2 flex items-center gap-1"
                                    >
                                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                        {errors.confirmPassword}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>

                        {/* Agreements Section */}
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{delay: 0.5}}
                            className="space-y-3"
                        >
                            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                                {/* All Agreement */}
                                <div
                                    className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-slate-200/50 hover:border-slate-300/50 transition-all duration-200">
                                    <div className="flex items-center space-x-3 w-full">
                                        <label
                                            className="flex items-center space-x-2 cursor-pointer w-full"
                                            htmlFor="agreement-all"
                                            onClick={(e) =>
                                                handleAgreementChange(
                                                    "all",
                                                    !formData.agreements.all
                                                )
                                            }
                                        >
                                            {formData.agreements.all ===
                                            true ? (
                                                <CheckCircleActive/>
                                            ) : (
                                                <CheckCircle/>
                                            )}
                                            <span className="w-full text-xs md:text-sm text-slate-600 cursor-pointer">
                                                전체 동의
                                            </span>
                                        </label>
                                        <input
                                            id="agreement-all"
                                            type="checkbox"
                                            checked={!!formData.agreements.all}
                                            readOnly
                                            className="invisible"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <motion.div
                                            animate={{
                                                // expandedAllTerms 상태에 따라 회전
                                                rotate: expandedAllTerms ? 180 : 0,
                                            }}
                                            transition={{duration: 0.2}}
                                            onClick={toggleAllTerms}
                                            className="cursor-pointer w-4 h-4"
                                        >
                                            <ChevronDownIcon className="h-4 w-4 text-slate-400"/>
                                        </motion.div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedAllTerms && (
                                        <>
                                            {/* Individual Agreements */}
                                            <div className="space-y-2 pl-[6px] pr-1">
                                                {[
                                                    {
                                                        key: "terms",
                                                        label: "서비스 이용약관 (필수)",
                                                        required: true,
                                                        pageId: NOTION_PAGE_ID.TERMS,
                                                        customClass: "h-full max-h-[85dvh]",
                                                    },
                                                    {
                                                        key: "privacy",
                                                        label: "개인정보 수집 및 이용 안내 (필수)",
                                                        required: true,
                                                        pageId: NOTION_PAGE_ID.PRIVACY,
                                                        customClass: "h-full max-h-[85dvh]",
                                                    },
                                                    {
                                                        key: "marketing",
                                                        label: "마케팅 및 프로모션 알림 동의 (선택)",
                                                        required: false,
                                                        pageId: NOTION_PAGE_ID.MARKETING,
                                                        customClass: "h-auto",
                                                    },
                                                ].map((item, index) => {
                                                    // 에러 상태인지 판단하는 변수 선언
                                                    // 1. 전체 에러가 있고 2. 필수 항목이며 3. 체크가 안 된 경우
                                                    const isError = errors.agreements && item.required && !formData.agreements[item.key];

                                                    return (
                                                        <motion.div
                                                            key={item.key}
                                                            initial={{
                                                                opacity: 0,
                                                                x: -10,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                x: 0,
                                                            }}
                                                            transition={{
                                                                delay:
                                                                    0.6 +
                                                                    index * 0.1,
                                                            }}
                                                            className="space-y-2"
                                                        >
                                                            <div
                                                                className="flex items-center justify-between p-2 hover:bg-white/50 rounded-lg transition-all duration-200 cursor-pointer">
                                                                <div className="flex items-center space-x-3 w-full">
                                                                    <label
                                                                        className="flex items-center space-x-2 cursor-pointer w-full"
                                                                        htmlFor={`agreement-${item.key}`}
                                                                        onClick={() =>
                                                                            handleAgreementChange(
                                                                                item.key,
                                                                                !formData.agreements[item.key]
                                                                            )
                                                                        }
                                                                    >
                                                                        {formData.agreements[item.key] === true ? (
                                                                            <CheckCircleActive/>
                                                                        ) : (
                                                                            <CheckCircle/>
                                                                        )}
                                                                        <span
                                                                            className={cn(
                                                                                "w-full text-xs md:text-sm cursor-pointer transition-colors duration-200",
                                                                                isError
                                                                                    ? "text-red-500 font-medium"  // 에러 시 빨간색 + 굵게
                                                                                    : "text-slate-600"            // 평소 회색
                                                                            )}
                                                                        >
                                                                                {item.label}
                                                                            </span>
                                                                    </label>
                                                                    <input
                                                                        id={`agreement-${item.key}`}
                                                                        type="checkbox"
                                                                        checked={
                                                                            !!formData
                                                                                .agreements[
                                                                                item
                                                                                    .key
                                                                                ]
                                                                        }
                                                                        readOnly
                                                                        className="invisible"
                                                                    />
                                                                    <Dialog>
                                                                        <DialogTrigger>
                                                                            <ExternalLinkIcon
                                                                                color="#94A3B8"
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        </DialogTrigger>
                                                                        <DialogContent
                                                                            className={cn(
                                                                                "bg-white",
                                                                                item.customClass
                                                                            )}
                                                                        >
                                                                            <DialogHeader>
                                                                                {/* 제목을 넣어주되, sr-only로 화면에서는 숨깁니다. */}
                                                                                <DialogTitle className="sr-only">
                                                                                    {item.label}
                                                                                </DialogTitle>
                                                                                <div className={cn("h-5")}></div>
                                                                            </DialogHeader>
                                                                            <DialogDescription asChild>
                                                                                <NotionModalContents
                                                                                    title={
                                                                                        item.label
                                                                                    }
                                                                                    pageId={
                                                                                        item.pageId
                                                                                    }
                                                                                />
                                                                            </DialogDescription>
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            <AnimatePresence>
                                {errors.agreements && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -10}}
                                        className="text-red-500 text-sm flex items-center gap-1"
                                    >
                                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                        {errors.agreements}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                        </motion.div>
                    </div>
                </Box>
                {/* Submit Button */}
                <motion.div
                    initial={{y: 20, opacity: 0}}
                    animate={{y: 0, opacity: 1}}
                    transition={{delay: 0.6}}
                >
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}
                                    className="flex items-center gap-2"
                                >
                                    <motion.div
                                        animate={{rotate: 360}}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            ease: "linear",
                                        }}
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                    />
                                    처리 중...
                                </motion.div>
                            ) : (
                                <motion.span
                                    key="submit"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    exit={{opacity: 0}}
                                >
                                    계정 등록
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Button>
                </motion.div>
            </motion.form>
        </div>
    );
}
