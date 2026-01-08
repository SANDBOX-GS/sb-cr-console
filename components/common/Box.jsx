import { cn } from "@/lib/utils";
export const Box = ({ bg = "white", className, children, ...props }) => {
    const bgClasses = {
        white: `bg-white`,
        blue300: `bg-blue-300`,
        blue100: `bg-blue-100`,
    };
    return (
        <div
            {...props}
            className={cn(
                "p-4 md:p-5 w-full rounded-xl shadow-sky-900/15 shadow-[0_4px_16px]",
                bgClasses[bg],
                className
            )}
        >
            {children}
        </div>
    );
};
