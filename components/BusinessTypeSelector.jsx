import { motion } from "framer-motion";

const BUSINESS_TYPES = [
    { key: "individual", label: "개인", description: "일반 개인" },
    { key: "sole_proprietor", label: "개인사업자", description: "사업자등록" },
    { key: "corporation", label: "법인사업자", description: "법인등록" },
    { key: "domestic_foreigner", label: "국내거주 외국인", description: "국내 거주" },
    { key: "overseas_resident", label: "해외거주자", description: "해외 거주" },
    { key: "minor", label: "미성년자", description: "법정대리인" },
];

function TabItem({ type, isSelected, onClick }) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            className={`
        relative flex-1 min-h-[60px] px-3 py-2 rounded-lg transition-all duration-300 group
        ${
                isSelected
                    ? "bg-white shadow-lg shadow-slate-200/50 border border-slate-200/50"
                    : "bg-slate-50/50 hover:bg-white/70 border border-transparent hover:border-slate-200/30"
            }
      `}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            initial={false}
            animate={{
                backgroundColor: isSelected ? "#ffffff" : "rgba(248, 250, 252, 0.5)",
            }}
            transition={{ duration: 0.2 }}
        >
            {/* Background gradient for selected state */}
            {isSelected && (
                <motion.div
                    layoutId="selectedBackground"
                    className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-white to-cyan-50/50 rounded-lg"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
            )}

            <div className="relative flex flex-col items-center justify-center text-center h-full">
                <div
                    className={`
          transition-all duration-300 mb-1
          ${
                        isSelected
                            ? "text-slate-800"
                            : "text-slate-600 group-hover:text-slate-700"
                    }
        `}
                >
                    {type.label}
                </div>
                <div
                    className={`
          text-xs transition-all duration-300
          ${
                        isSelected
                            ? "text-slate-500"
                            : "text-slate-400 group-hover:text-slate-500"
                    }
        `}
                >
                    {type.description}
                </div>
            </div>

            {/* Selection indicator */}
            {isSelected && (
                <motion.div
                    layoutId="selectionIndicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-full"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                />
            )}
        </motion.button>
    );
}

export default function BusinessTypeSelector({ value, onChange }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-slate-800 mb-2">사업자 분류</h3>
                <p className="text-sm text-slate-600">
                    해당하는 사업자 분류를 선택해 주세요
                </p>
            </div>

            {/* Tab Container */}
            <div className="relative bg-slate-100/80 backdrop-blur-sm rounded-xl p-2 border border-slate-200/50">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-slate-100/50 rounded-xl pointer-events-none" />

                <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {BUSINESS_TYPES.map((type) => (
                        <TabItem
                            key={type.key}
                            type={type}
                            isSelected={value === type.key}
                            onClick={() => onChange(type.key)}
                        />
                    ))}
                </div>
            </div>

            {/* Info Card */}
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.2 }}
                className="mt-4 p-4 bg-gradient-to-r from-sky-50/50 to-sky-50/50 rounded-xl border border-sky-200/30"
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-sky-500 to-sky-500 rounded-full mt-2" />
                    <div className="text-sm text-sky-800/80">
                        {getBusinessTypeInfo(value)}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function getBusinessTypeInfo(businessType) {
    const infoMap = {
        individual: "일반 개인으로 기타소득 신고를 통해 정산을 받으실 수 있습니다.",
        sole_proprietor:
            "개인사업자로 사업소득 신고를 통해 정산을 받으실 수 있습니다. 사업자등록번호가 필요합니다.",
        corporation:
            "법인사업자로 사업소득 신고를 통해 정산을 받으실 수 있습니다. 법인등록번호가 필요합니다.",
        domestic_foreigner:
            "국내에 거주하는 외국인으로 외국인등록번호가 필요합니다.",
        overseas_resident: "해외에 거주하는 분으로 특별 세무 처리가 적용됩니다.",
        minor: "미성년자의 경우 법정대리인의 정보와 동의가 필요합니다.",
    };

    return infoMap[businessType] || "";
}