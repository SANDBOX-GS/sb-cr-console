
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { motion } from "framer-motion";
import { CreditCardIcon, CheckCircleIcon } from "lucide-react";

const BANKS = [
    { code: "004", name: "국민은행" },
    { code: "003", name: "기업은행" },
    { code: "011", name: "농협은행" },
    { code: "020", name: "우리은행" },
    { code: "088", name: "신한은행" },
    { code: "081", name: "하나은행" },
    { code: "023", name: "SC제일은행" },
    { code: "027", name: "한국씨티은행" },
    { code: "071", name: "우체국" },
    { code: "089", name: "케이뱅크" },
    { code: "090", name: "카카오뱅크" },
    { code: "092", name: "토스뱅크" },
];

export default function BankAccountSelector({ value, onChange, error }) {
    const [isValidating, setIsValidating] = useState(false);
    const [isValidated, setIsValidated] = useState(false);

    const handleValidateAccount = async () => {
        if (!value.bankCode || !value.accountNumber || !value.accountHolder) return;

        setIsValidating(true);
        // Simulate API call for account validation
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsValidated(true);
        setIsValidating(false);
    };

    const formatAccountNumber = (accountNum) => {
        // Remove all non-digits
        const digits = accountNum.replace(/\D/g, "");
        // Add hyphens for better readability (simple formatting)
        if (digits.length > 4) {
            return digits.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
        }
        return digits;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50"
        >
            <div className="flex items-center gap-2 mb-3">
                <CreditCardIcon className="h-5 w-5 text-sky-600" />
                <h3 className="font-semibold text-slate-800">은행 계좌 정보</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        은행
                    </label>
                    <Select
                        value={value.bankCode}
                        onValueChange={(bankCode) => onChange({ ...value, bankCode })}
                    >
                        <SelectTrigger className="bg-white/80">
                            <SelectValue placeholder="은행을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {BANKS.map((bank) => (
                                <SelectItem key={bank.code} value={bank.code}>
                                    {bank.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                        계좌번호
                    </label>
                    <Input
                        type="text"
                        placeholder="계좌번호를 입력하세요"
                        value={value.accountNumber}
                        onChange={(e) => {
                            const formatted = formatAccountNumber(e.target.value);
                            onChange({ ...value, accountNumber: formatted });
                        }}
                        className="bg-white/80"
                        maxLength={20}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                    예금주명
                </label>
                <Input
                    type="text"
                    placeholder="예금주명을 입력하세요"
                    value={value.accountHolder}
                    onChange={(e) =>
                        onChange({ ...value, accountHolder: e.target.value })
                    }
                    className="bg-white/80"
                />
            </div>

            {value.bankCode &&
                value.accountNumber &&
                value.accountHolder &&
                !isValidated && (
                    <Button
                        onClick={handleValidateAccount}
                        disabled={isValidating}
                        variant="outline"
                        className="w-full mt-4 bg-white/80 border-sky-200 hover:bg-sky-50"
                    >
                        {isValidating ? (
                            <motion.div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full"
                                />
                                계좌 확인 중...
                            </motion.div>
                        ) : (
                            "계좌 확인"
                        )}
                    </Button>
                )}

            {isValidated && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700">계좌 확인이 완료되었습니다.</span>
                </motion.div>
            )}

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-sm flex items-center gap-1"
                >
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    {error}
                </motion.p>
            )}
        </motion.div>
    );
}
