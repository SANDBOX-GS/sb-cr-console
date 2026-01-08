import { cn } from "@/lib/utils";
export const Button = ({
    variant = "primary",
    size = "lg",
    round = "full",
    className,
    onClick,
    children,
    ...props
}) => {
    const variantStyles = {
        primary: `
      bg-primary-gradient text-white 
      hover:opacity-90 active:opacity-80
    `,
        secondary: `
      bg-slate-700 text-white 
      hover:bg-slate-800 active:bg-slate-900
    `,
        line: `
      bg-white border border-slate-300 text-slate-600
      hover:bg-slate-50 active:bg-slate-100
    `,
    };

    const sizeStyles = {
        sm: "h-8 px-3 text-xs md:text-sm",
        md: "h-10 px-4 text-xs md:text-sm",
        lg: "h-12 px-6 text-sm md:text-base",
    };

    const rounded = {
        full: "rounded-full",
        xl: "rounded-xl",
        lg: "rounded-lg",
        md: "rounded-md",
        sm: "rounded-sm",
    };

    return (
        <button
            {...props}
            onClick={onClick}
            className={cn(
                "font-semibold transition-all duration-150 flex items-center justify-center shadow-sky-900/15 shadow-[0_4px_8px]",
                variantStyles[variant],
                sizeStyles[size],
                rounded[round],
                className
            )}
        >
            {children}
        </button>
    );
};
