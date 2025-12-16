"use client";
import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/common/Button";
import { Box } from "@/components/common/Box";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EyeIcon,
  EyeOffIcon,
  ChevronDownIcon,
  AlertCircleIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TERMS_CONTENT } from "@/constants/terms-content";
import { useRouter } from "@/hooks/useRouter";
import { IconCard } from "@/components/common/IconCard";
import { ShieldProtect } from "@/components/icon/ShieldProtect";
import { CheckCircleActive } from "@/components/icon/CheckCircleActive";
import { CheckCircle } from "@/components/icon/CheckCircle";

function PasswordStrengthIndicator({ password }) {
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, text: "", color: "bg-gray-200" };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score = Object.values(checks).filter(Boolean).length;

    if (score <= 2) return { score, text: "약함", color: "bg-red-400" };
    if (score <= 3) return { score, text: "보통", color: "bg-yellow-400" };
    if (score <= 4) return { score, text: "강함", color: "bg-sky-400" };
    return { score, text: "매우 강함", color: "bg-green-400" };
  };

  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className={`h-full ${strength.color} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${(strength.score / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-slate-600">{strength.text}</span>
      </div>
    </motion.div>
  );
}

function TermsContent({ content }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="bg-slate-50/80 rounded-lg p-4 mt-3 max-h-60 overflow-y-auto">
        <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {content}
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const { navigate } = useRouter();
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

  // 검증 관련 State 추가
  const [isVerifying, setIsVerifying] = useState(false); // 검증 로딩 상태
  const [isAccessDenied, setIsAccessDenied] = useState(false); // 접근 차단 상태

  // 약관 토글 상태 관리
  const [expandedTerm, setExpandedTerm] = useState(null);
  const [expandedAllTerms, setExpandedAllTerms] = useState(false);

  useEffect(() => {
    if (expandedTerm === "all") setExpandedAllTerms(!expandedAllTerms);
  }, [expandedTerm]);

  // [추가된 로직] 컴포넌트 마운트 시 URL 파라미터 검증
  //   useEffect(() => {
  //     const verifyToken = async () => {
  //       const token = searchParams.get("code");

  //       if (!token) {
  //         // 토큰이 아예 없으면 접근 차단
  //         setIsAccessDenied(true);
  //         setIsVerifying(false);
  //         return;
  //       }

  //       try {
  //         // 백엔드에 토큰 검증 요청 (API 경로는 실제 환경에 맞춰 수정 필요)
  //         const response = await fetch("/api/member/check_uuid", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ token: token }),
  //         });

  //         if (response.ok) {
  //           setIsAccessDenied(false);
  //         } else {
  //           // DB에 없거나 만료된 경우
  //           setIsAccessDenied(true);
  //         }
  //       } catch (error) {
  //         console.error("Token verification failed:", error);
  //         setIsAccessDenied(true);
  //       } finally {
  //         setIsVerifying(false);
  //       }
  //     };

  //     verifyToken();
  //   }, [searchParams]);

  // [화면 1] 검증 중일 때 로딩 화면
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // [화면 2] 접근 권한이 없을 때 에러 화면
  if (isAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <AlertCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            유효하지 않은 접근입니다
          </h2>
          <p className="text-gray-600 mb-6">
            잘못된 링크이거나 유효기간이 만료된 주소입니다.
            <br />
            관리자에게 문의해 주세요.
          </p>
          <Button
            onClick={() => navigate("/login")} // 혹은 메인으로 이동
            className="bg-slate-800 text-white"
          >
            메인으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "비밀번호는 최소 8자 이상이어야 합니다.";
    }
    if (password.length > 16) {
      return "비밀번호는 16자 이하여야 합니다.";
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLower && !hasUpper) {
      return "비밀번호에는 최소 하나의 영문이 포함되어야 합니다.";
    }
    if (!hasNumber) {
      return "비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.";
    }
    if (!hasSpecial) {
      return "비밀번호에는 최소 하나의 특수문자가 포함되어야 합니다.";
    }

    return null;
  };

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
      !formData.agreements.privacy ||
      !formData.agreements.thirdParty
    ) {
      newErrors.agreements = "필수 항목에 동의해 주세요.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const code = searchParams.get("code");

        const response = await fetch("/api/member/password_register", {
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
            agreed_to_third_party: formData.agreements.thirdParty ? "Y" : "N",
            agreed_to_marketing: formData.agreements.marketing ? "Y" : "N",
          }),
        });

        if (response.ok) {
          navigate("/login", {});
          console.log("회원가입 성공!");
        } else {
          const errorData = await response.json();
          console.error("회원가입 실패:", errorData);
          alert(errorData.message); // 사용자에게 실패 메시지 표시
        }
      } catch (error) {
        console.error("API 호출 중 오류 발생:", error);
        alert("네트워크 오류가 발생했습니다."); // 네트워크 오류 메시지 표시
      }
    }

    setIsLoading(false);
  };

  const handleAgreementChange = (key, checked) => {
    console.log("Agreement changed:", key, checked);
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
      const newAgreements = { ...formData.agreements, [key]: checked };
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
      setErrors((prev) => ({ ...prev, agreements: undefined }));
    }
  };

  const toggleTermExpansion = (termKey) => {
    setExpandedTerm(expandedTerm === termKey ? null : termKey);
  };

  const toggelAllTerms = () => {};

  return (
    <div className="flex-1 flex flex-col items-center justify-start w-full max-w-[816px] mx-auto">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="">
          샌드박스 크리에이터
          <br /> 정산 시스템
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
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        onSubmit={handleSubmit}
        className="w-full"
      >
        <Box className="mb-10">
          <div className="space-y-8 relative">
            {/* Email Section */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h4 className="mb-4">샌드박스 수취인 계정 등록</h4>
              <label className="font-medium">로그인 계정</label>
              <p className="text-slate-600">
                이메일을 수신한 이메일 주소를 입력해 주세요.
              </p>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="이메일"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
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
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
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
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <label className="font-medium">
                비밀번호 등록 및 계정 활성화
              </label>

              <div className="space-y-4">
                {/* Password Input */}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }));
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all duration-200 pr-12 ${
                      errors.password
                        ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeOffIcon className="h-5 w-5" />
                    )}
                  </button>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
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
                    type={showConfirmPassword ? "text" : "password"}
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="h-5 w-5" />
                    ) : (
                      <EyeOffIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-500 text-sm mt-2 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Agreements Section */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                {/* All Agreement */}
                <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-slate-200/50 hover:border-slate-300/50 transition-all duration-200">
                  <div className="flex items-center space-x-3 w-full">
                    <label
                      className="flex items-center space-x-2 cursor-pointer w-full"
                      htmlFor={formData.agreements.all}
                      onClick={(e) =>
                        handleAgreementChange("all", !formData.agreements.all)
                      }
                    >
                      {formData.agreements.all === true ? (
                        <CheckCircleActive />
                      ) : (
                        <CheckCircle />
                      )}
                      <span className="w-full text-sm text-slate-600 cursor-pointer">
                        전체 동의
                      </span>
                    </label>
                    <input
                      id={formData.agreements.all}
                      type="checkbox"
                      checked={!!formData.agreements.all}
                      readOnly
                      className="invisible"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <motion.div
                      animate={{
                        rotate: expandedTerm === "all" ? 180 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      onClick={() => toggleTermExpansion("all")}
                      className="cursor-pointer w-4 h-4"
                    >
                      <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedAllTerms && (
                    <>
                      {/* Individual Agreements */}
                      <div className="space-y-2 pl-4">
                        {[
                          {
                            key: "terms",
                            label: "서비스 이용약관(필수)",
                            required: true,
                            content: TERMS_CONTENT.terms,
                          },
                          {
                            key: "privacy",
                            label: "개인정보 수집 및 이용에 대한 안내(필수)",
                            required: true,
                            content: TERMS_CONTENT.privacy,
                          },
                          {
                            key: "thirdParty",
                            label: "개인정보 제 3자 제공 동의(필수)",
                            required: true,
                            content: TERMS_CONTENT.thirdParty,
                          },
                          {
                            key: "marketing",
                            label: "마케팅 및 혜택 프로모션 알림 동의(선택)",
                            required: false,
                            content: TERMS_CONTENT.marketing,
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={item.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between p-2 hover:bg-white/50 rounded-lg transition-all duration-200 cursor-pointer">
                              <div className="flex items-center space-x-3 w-full">
                                <label
                                  className="flex items-center space-x-2 cursor-pointer w-full"
                                  htmlFor={formData.agreements[item.key]}
                                  onClick={(e) =>
                                    handleAgreementChange(
                                      item.key,
                                      !formData.agreements[item.key]
                                    )
                                  }
                                >
                                  {formData.agreements[item.key] === true ? (
                                    <CheckCircleActive />
                                  ) : (
                                    <CheckCircle />
                                  )}
                                  <span className="w-full text-sm text-slate-600 cursor-pointer">
                                    {item.label}
                                  </span>
                                </label>
                                <input
                                  id={formData.agreements[item.key]}
                                  type="checkbox"
                                  checked={!!formData.agreements[item.key]}
                                  readOnly
                                  className="invisible"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <motion.div
                                  animate={{
                                    rotate: expandedTerm === item.key ? 180 : 0,
                                  }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() => toggleTermExpansion(item.key)}
                                  className="cursor-pointer w-4 h-4"
                                >
                                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                                </motion.div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {expandedTerm === item.key && (
                                <TermsContent content={item.content} />
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                      <AnimatePresence>
                        {errors.agreements && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-500 text-sm flex items-center gap-1"
                          >
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {errors.agreements}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </Box>
        {/* Submit Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button type="submit" disabled={isLoading} className="w-full">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
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
