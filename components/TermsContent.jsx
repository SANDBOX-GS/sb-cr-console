import { motion } from "framer-motion"

export default function TermsContent({ content }) {
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
