import { motion, AnimatePresence } from "framer-motion";
import { Box } from "./Box";
export const IconCard = ({
    h = "",
    infoTitle = "",
    infoLi = [""],
    desc = [""],
    icon: Icon,
}) => {
    return (
        <>
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-left mb-12 flex flex-col md:flex-row h-full gap-8"
            >
                <Box
                    bg="blue300"
                    className={
                        "relative w-full h-full md:w-[256px] min-w-[256px] min-h-[188px] px-auto overflow-hidden"
                    }
                >
                    <Icon className="absolute inset-0 flex items-center justify-center translate-x-[-13%] translate-y-5" />
                </Box>
                <div className="flex flex-col gap-4">
                    <h4>{h}</h4>
                    <Box className="text-slate-700 text-left">
                        <p className="text-slate-700 font-bold">{infoTitle}</p>
                        <ul className="px-4 pt-2 text-slate-500">
                            {infoLi.map((li, idx) => (
                                <li key={idx} className="list-disc">
                                    <p>{li}</p>
                                </li>
                            ))}
                        </ul>
                    </Box>
                    <div className="mt-1 space-y-0.5">
                        {desc.map((d, idx) => (
                            <p
                                key={idx}
                                className="text-xs md:text-sm text-slate-500"
                            >
                                {d}
                            </p>
                        ))}
                    </div>
                </div>
            </motion.div>
        </>
    );
};
