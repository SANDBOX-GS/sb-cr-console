import { motion } from "framer-motion";
import { UserIcon } from "lucide-react";

/**
 * @typedef {object} PageTitleProps
 * @property {string} title 페이지의 주요 제목입니다.
 * @property {string} description 페이지의 간략한 설명입니다.
 */

/**
 * 앱의 주요 페이지 제목과 설명을 표시하는 애니메이션 컴포넌트입니다.
 * @param {PageTitleProps} props
 */
export function PageTitle({ title, description }) {
    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
        >
            <div className="inline-flex items-center gap-2 mb-4">
                <UserIcon className="h-8 w-8 text-indigo-600" />
            </div>

            <h1 className="text-4xl font-bold text-slate-800 mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-700 bg-clip-text text-transparent">
                {title}
            </h1>

            <p className="text-lg text-slate-600 max-w-lg">
                {description}
            </p>
        </motion.div>
    );
}