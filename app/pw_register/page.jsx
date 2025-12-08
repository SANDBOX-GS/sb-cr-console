"use client";
import {useState, useEffect} from 'react';
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Checkbox} from "@/components/ui/checkbox";
import {EyeIcon, EyeOffIcon, ChevronDownIcon, CheckCircleIcon, ShieldCheckIcon, SparklesIcon} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {TERMS_CONTENT} from "@/constants/terms-content";
import {useRouter} from "@/hooks/useRouter";

function PasswordStrengthIndicator({password}) {
    const getPasswordStrength = (password) => {
        if (!password) return {score: 0, text: '', color: 'bg-gray-200'};

        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        score = Object.values(checks).filter(Boolean).length;

        if (score <= 2) return {score, text: '약함', color: 'bg-red-400'};
        if (score <= 3) return {score, text: '보통', color: 'bg-yellow-400'};
        if (score <= 4) return {score, text: '강함', color: 'bg-blue-400'};
        return {score, text: '매우 강함', color: 'bg-green-400'};
    };

    const strength = getPasswordStrength(password);

    if (!password) return null;

    return (
        <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            className="mt-2 space-y-2"
        >
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                        className={`h-full ${strength.color} rounded-full`}
                        initial={{width: 0}}
                        animate={{width: `${(strength.score / 5) * 100}%`}}
                        transition={{duration: 0.3}}
                    />
                </div>
                <span className="text-xs text-slate-600">{strength.text}</span>
            </div>
        </motion.div>
    );
}

function TermsContent({content}) {
    return (
        <motion.div
            initial={{opacity: 0, height: 0}}
            animate={{opacity: 1, height: "auto"}}
            exit={{opacity: 0, height: 0}}
            transition={{duration: 0.3}}
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

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        agreements: {
            all: false,
            terms: false,
            privacy: false,
            thirdParty: false,
            marketing: false
        }
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 약관 토글 상태 관리
    const [expandedTerm, setExpandedTerm] = useState(null);

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
            newErrors.email = '이메일을 입력해 주세요.';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = '올바른 이메일 형식을 입력해 주세요.';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해 주세요.';
        } else {
            const passwordError = validatePassword(formData.password);
            if (passwordError) {
                newErrors.password = passwordError;
            }
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호 확인을 입력해 주세요.';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = '비밀번호와 일치하지 않습니다.';
        }

        // Required agreements validation
        if (!formData.agreements.terms || !formData.agreements.privacy || !formData.agreements.thirdParty) {
            newErrors.agreements = '필수 항목에 동의해 주세요.';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            try {
                const response = await fetch('/api/member/password_register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        agreed_to_terms: formData.agreements.terms ? 'Y' : 'N',
                        agreed_to_privacy: formData.agreements.privacy ? 'Y' : 'N',
                        agreed_to_third_party: formData.agreements.thirdParty ? 'Y' : 'N',
                        agreed_to_marketing: formData.agreements.marketing ? 'Y' : 'N',
                    }),
                });

                if (response.ok) {
                    setIsSubmitted(true);
                    console.log('회원가입 성공!');
                } else {
                    const errorData = await response.json();
                    console.error('회원가입 실패:', errorData);
                    alert(errorData.message); // 사용자에게 실패 메시지 표시
                }
            } catch (error) {
                console.error('API 호출 중 오류 발생:', error);
                alert('네트워크 오류가 발생했습니다.'); // 네트워크 오류 메시지 표시
            }
        }

        setIsLoading(false);
    };

    const handleAgreementChange = (key, checked) => {
        if (key === 'all') {
            setFormData(prev => ({
                ...prev,
                agreements: {
                    all: checked,
                    terms: checked,
                    privacy: checked,
                    thirdParty: checked,
                    marketing: checked
                }
            }));
        } else {
            const newAgreements = {...formData.agreements, [key]: checked};
            const allRequired = newAgreements.terms && newAgreements.privacy && newAgreements.thirdParty;
            newAgreements.all = allRequired && newAgreements.marketing;

            setFormData(prev => ({
                ...prev,
                agreements: newAgreements
            }));
        }

        // Clear agreement errors when user checks required items
        if (errors.agreements && (formData.agreements.terms || formData.agreements.privacy || formData.agreements.thirdParty)) {
            setErrors(prev => ({...prev, agreements: undefined}));
        }
    };

    const toggleTermExpansion = (termKey) => {
        setExpandedTerm(expandedTerm === termKey ? null : termKey);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4">
                    <motion.div
                        initial={{scale: 0.8, opacity: 0}}
                        animate={{scale: 1, opacity: 1}}
                        transition={{duration: 0.5, delay: 0.2}}
                        className="text-center max-w-md"
                    >
                        <motion.div
                            initial={{scale: 0}}
                            animate={{scale: 1}}
                            transition={{delay: 0.5, type: "spring", stiffness: 200}}
                            className="relative mb-6"
                        >
                            <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"></div>
                            <CheckCircleIcon className="relative mx-auto h-20 w-20 text-green-500"/>
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    delay: 1,
                                    duration: 0.6,
                                    ease: "easeInOut"
                                }}
                                className="absolute -top-2 -right-2"
                            >
                                <SparklesIcon className="h-8 w-8 text-yellow-400"/>
                            </motion.div>
                        </motion.div>

                        <motion.h1
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: 0.7}}
                            className="text-3xl font-bold text-slate-800 mb-3 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
                        >
                            비밀번호 등록 완료!
                        </motion.h1>

                        <motion.p
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: 0.9}}
                            className="text-slate-600 mb-6"
                        >
                            계정이 성공적으로 활성화되었습니다.
                        </motion.p>

                        <motion.div
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: 1.1}}
                        >
                            <Button
                                onClick={() =>
                                    navigate("/login", {})
                                }
                                className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                시작하기
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-start px-4 py-12">
            <motion.div
                initial={{y: 30, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.6}}
                className="text-center mb-12"
            >
                <div className="inline-flex items-center gap-2 mb-4">
                    <ShieldCheckIcon className="h-8 w-8 text-indigo-600"/>
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <SparklesIcon className="h-6 w-6 text-yellow-400"/>
                    </motion.div>
                </div>

                <h1 className="text-4xl font-bold text-slate-800 mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-700 bg-clip-text text-transparent">
                    크리에이터 정산 계정 등록
                </h1>

                <p className="text-lg text-slate-600 max-w-md">
                    아래에서 로그인 계정 주소를 확인하고 비밀번호를 등록해 주세요.
                </p>
            </motion.div>

            <motion.form
                initial={{y: 30, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{duration: 0.6, delay: 0.2}}
                onSubmit={handleSubmit}
                className="w-full max-w-md"
            >
                <div
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 relative overflow-hidden">
                    {/* Decorative gradient overlay */}
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>

                    <div className="space-y-8 relative">
                        {/* Email Section */}
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{delay: 0.3}}
                            className="space-y-3"
                        >
                            <label className="block text-lg font-semibold text-slate-800">
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
                                        setFormData(prev => ({...prev, email: e.target.value}));
                                        if (errors.email) setErrors(prev => ({...prev, email: undefined}));
                                    }}
                                    className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
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
                            <label className="block text-lg font-semibold text-slate-800">
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
                                            setFormData(prev => ({...prev, password: e.target.value}));
                                            if (errors.password) setErrors(prev => ({...prev, password: undefined}));
                                        }}
                                        className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 pr-12 ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                    >
                                        {showPassword ? <EyeIcon className="h-5 w-5"/> :
                                            <EyeOffIcon className="h-5 w-5"/>}
                                    </button>
                                    <PasswordStrengthIndicator password={formData.password}/>
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
                                </div>

                                {/* Confirm Password Input */}
                                <div className="relative">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="비밀번호 확인"
                                        value={formData.confirmPassword}
                                        onChange={(e) => {
                                            setFormData(prev => ({...prev, confirmPassword: e.target.value}));
                                            if (errors.confirmPassword) setErrors(prev => ({
                                                ...prev,
                                                confirmPassword: undefined
                                            }));
                                        }}
                                        className={`h-12 bg-white/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 pr-12 ${errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                                    >
                                        {showConfirmPassword ? <EyeIcon className="h-5 w-5"/> :
                                            <EyeOffIcon className="h-5 w-5"/>}
                                    </button>
                                    <AnimatePresence>
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
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>

                        {/* Agreements Section */}
                        <motion.div
                            initial={{x: -20, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{delay: 0.5}}
                            className="space-y-3"
                        >
                            <div className="bg-slate-50/50 rounded-xl p-4 space-y-3">
                                {/* All Agreement */}
                                <div
                                    className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-slate-200/50 hover:border-slate-300/50 transition-all duration-200">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            checked={formData.agreements.all}
                                            onCheckedChange={(checked) => handleAgreementChange('all', checked)}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <label className="font-medium text-slate-700 cursor-pointer">전체 동의</label>
                                    </div>
                                    <motion.div
                                        animate={{rotate: expandedTerm === 'all' ? 180 : 0}}
                                        transition={{duration: 0.2}}
                                    >
                                        <ChevronDownIcon className="h-4 w-4 text-slate-500"/>
                                    </motion.div>
                                </div>

                                {/* Individual Agreements */}
                                <div className="space-y-2 pl-4">
                                    {[
                                        {
                                            key: 'terms',
                                            label: '서비스 이용약관(필수)',
                                            required: true,
                                            content: TERMS_CONTENT.terms
                                        },
                                        {
                                            key: 'privacy',
                                            label: '개인정보 수집 및 이용에 대한 안내(필수)',
                                            required: true,
                                            content: TERMS_CONTENT.privacy
                                        },
                                        {
                                            key: 'thirdParty',
                                            label: '개인정보 제 3자 제공 동의(필수)',
                                            required: true,
                                            content: TERMS_CONTENT.thirdParty
                                        },
                                        {
                                            key: 'marketing',
                                            label: '마케팅 및 혜택 프로모션 알림 동의(선택)',
                                            required: false,
                                            content: TERMS_CONTENT.marketing
                                        }
                                    ].map((item, index) => (
                                        <motion.div
                                            key={item.key}
                                            initial={{opacity: 0, x: -10}}
                                            animate={{opacity: 1, x: 0}}
                                            transition={{delay: 0.6 + index * 0.1}}
                                            className="space-y-2"
                                        >
                                            <div
                                                className="flex items-center justify-between p-2 hover:bg-white/50 rounded-lg transition-all duration-200 cursor-pointer"
                                                onClick={() => toggleTermExpansion(item.key)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        checked={formData.agreements[item.key]}
                                                        onCheckedChange={(checked) => handleAgreementChange(item.key, checked)}
                                                        className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <label
                                                        className="text-sm text-slate-600 cursor-pointer">{item.label}</label>
                                                </div>
                                                <motion.div
                                                    animate={{rotate: expandedTerm === item.key ? 180 : 0}}
                                                    transition={{duration: 0.2}}
                                                >
                                                    <ChevronDownIcon className="h-3 w-3 text-slate-400"/>
                                                </motion.div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedTerm === item.key && (
                                                    <TermsContent content={item.content}/>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
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
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div
                            initial={{y: 20, opacity: 0}}
                            animate={{y: 0, opacity: 1}}
                            transition={{delay: 0.6}}
                        >
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
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
                                                transition={{duration: 1, repeat: Infinity, ease: "linear"}}
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
                                            비밀번호 등록
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </motion.form>
        </div>
    );
}