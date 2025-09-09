import { motion } from "framer-motion"

export default function PasswordStrengthIndicator({ password }) {
    const getPasswordStrength = (password) => {
        if (!password) return { score: 0, text: '', color: 'bg-gray-200' };

        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        score = Object.values(checks).filter(Boolean).length;

        if (score <= 2) return { score, text: '약함', color: 'bg-red-400' };
        if (score <= 3) return { score, text: '보통', color: 'bg-yellow-400' };
        if (score <= 4) return { score, text: '강함', color: 'bg-blue-400' };
        return { score, text: '매우 강함', color: 'bg-green-400' };
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
