"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "@/hooks/useRouter";
import { useAuth } from "@/contexts/AuthContext";
import { Box } from "@/components/common/Box";

export default function LoginPageContent() {
    const { navigate } = useRouter();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                const response = await fetch("/api/member/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();

                if (response.ok) {
                    // 200 OK: 로그인 성공
                    login();
                    navigate("/payee_info_register", { tab: "guide" });
                    // 실제 애플리케이션에서는 여기서 토큰/세션 저장 로직이 들어갑니다.
                } else {
                    // 401, 403, 500 등 에러 처리
                    alert(`로그인 실패: ${data.message}`);
                    console.error("Login failed:", data);
                }
            } catch (error) {
                console.error("API 호출 중 오류 발생:", error);
                alert("네트워크 오류 또는 서버 접속에 실패했습니다.");
            }
        }

        setIsLoading(false);
    };
    return (
        <div className="flex-1 flex flex-col items-center justify-start">
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <div className="bg-primary-gradient w-full"></div>
                <h1 className="text-slate-800">
                    샌드박스 크리에이터
                    <br /> 정산 시스템
                </h1>
            </motion.div>

            <motion.form
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                onSubmit={handleSubmit}
                className="w-full max-w-md"
            >
                <Box className="">
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

                    <div className="space-y-6 relative">
                        {/* Email Section */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="space-y-3"
                        >
                            <label className="block text-lg font-semibold text-slate-800">
                                이메일
                            </label>
                            <div className="relative">
                                <Input
                                    type="email"
                                    placeholder="email"
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
                                    className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 ${
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
                            <label className="block text-lg font-semibold text-slate-800">
                                비밀번호
                            </label>

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
                                            setErrors((prev) => ({
                                                ...prev,
                                                password: undefined,
                                            }));
                                    }}
                                    className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 pr-12 ${
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
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Button
                                type="submit"
                                disabled={isLoading}
                                variant="primary"
                                size="lg"
                                className={"w-full"}
                            >
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
                                            로그인
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    </div>
                </Box>
            </motion.form>
        </div>
    );
}