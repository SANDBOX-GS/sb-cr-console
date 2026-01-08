"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Box } from "../common/Box";
import { Input } from "../ui/input";
import { motion } from "framer-motion";
import { CheckCircleActive } from "../icon/CheckCircleActive";
import { CheckCircle } from "../icon/CheckCircle";
import { getIn, setIn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import FileUpload from "../ui/file-upload";
import { Button } from "../common/Button";
import {
    Dialog,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogDescription,
    DialogTitle,
} from "../ui/dialog";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";

const FULL_WIDTH_TYPES = new Set(["radio", "checkbox", "file"]);
const getFieldWrapperClass = (info) => {
    const isFullByType = FULL_WIDTH_TYPES.has(info?.type);
    const isFullByFlag = !!info?.fullWidth; // formatter에서 주는 옵션
    return cn(isFullByType || isFullByFlag ? "md:col-span-2" : "md:col-span-1");
};
const getInfoWrapperClass = (info) => {
    const isFullByFlag = !!info?.fullWidth; // formatter에서 주는 옵션
    return cn(isFullByFlag ? "md:col-span-2" : "md:col-span-1");
};

export default function InfoBox({
    title = "",
    className = "",
    children,
    mode = "edit",
    Info = [],
    formData,
    setFormData,
    errors = {},
    setErrors,
    isToggle = false,
    isOpen = false,
    onToggle,
}) {
    return (
        <div>
            <Box className={cn("flex flex-col gap-4", className)}>
                <div className="flex w-full justify-between items-center">
                    <h4>{title}</h4>
                    {isToggle && (
                        <button
                            onClick={onToggle}
                            className={cn(
                                "text-slate-500",
                                isOpen ? "rotate-180" : ""
                            )}
                        >
                            <ChevronDown />
                        </button>
                    )}
                </div>
                {isOpen && (
                    <div className={cn("flex flex-col gap-4")}>
                        {mode === "view" && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
                                {Info.map((info, index) => (
                                    <InfoView
                                        key={index}
                                        {...info}
                                        wrapperClassName={getInfoWrapperClass(
                                            info
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                        {mode === "edit" && (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
                                {Info.map((info, index) => (
                                    <InfoEdit
                                        key={index}
                                        {...info}
                                        formData={formData}
                                        setFormData={setFormData}
                                        errors={errors}
                                        setErrors={setErrors}
                                        wrapperClassName={getFieldWrapperClass(
                                            info
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {children}
            </Box>
        </div>
    );
}

export const InfoView = ({
    label = "본명*",
    id = "real_name",
    value = "홍길동",
    type = "text",
    src = "",
    wrapperClassName,
}) => {
    const [size, setSize] = useState(null);
    return (
        <div
            className={cn(
                "flex flex-row gap-2 items-center justify-between w-full",
                wrapperClassName
            )}
        >
            <p className="font-medium text-slate-700 whitespace-nowrap shrink-0">
                {label}
            </p>
            {type === "file" ? (
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <p className="text-slate-500 truncate flex-1 min-w-0 text-right">
                        {value}
                    </p>
                    <Dialog>
                        <DialogTrigger className="w-auto">
                            <Button
                                variant="line"
                                size="sm"
                                round="md"
                                className="shrink-0 shadow-sm flex gap-2 font-normal"
                            >
                                미리보기
                                <ExternalLinkIcon color="#94A3B8" size={16} />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={"flex flex-col "}>
                            <DialogHeader>
                                <DialogTitle>
                                    {label} : {src.name}
                                </DialogTitle>
                            </DialogHeader>
                            <DialogDescription>
                                <div className="relative">
                                    {["png", "jpg", "jpeg", "webp"].includes(
                                        src.ext
                                    ) ? (
                                        <div
                                            className={`overflow-hidden flex items-center justify-center w-full`}
                                        >
                                            {console.log(size)}
                                            <Image
                                                src={IMG_URL + src.url}
                                                alt={src.name}
                                                width={size?.width ?? 200}
                                                height={size?.height ?? 200}
                                                style={{
                                                    maxWidth: "768px",
                                                    objectFit: "contain",
                                                    margin: "auto",
                                                }}
                                                onLoadingComplete={(img) => {
                                                    setSize({
                                                        width: img.naturalWidth,
                                                        height: img.naturalHeight,
                                                    });
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden flex items-center justify-center">
                                            <iframe
                                                src={IMG_URL + src.url}
                                                title={src.name}
                                                className="w-full bg-white border-none rounded-lg bg-white h-[60dvh] md:h-[40dvh]"
                                            />
                                        </div>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <p className="text-slate-500">{value}</p>
            )}
        </div>
    );
};

export const InfoEdit = ({
    id,
    label,
    value,
    type = "text",
    path,
    options,
    errorKey,
    formData,
    setFormData,
    errors,
    setErrors,
    readOnly,
    placeholder,
    maxLength,
    wrapperClassName,
}) => {
    // 현재 값
    const currentValue = path ? getIn(formData, path, "") : "";

    const clearError = () => {
        if (!setErrors || !errorKey) return;
        if (!errors?.[errorKey]) return;
        setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    };

    const updateValue = (next) => {
        if (!setFormData || !path) return;
        setFormData((prev) => {
            const updated = setIn(prev || {}, path, next);
            return updated;
        });

        clearError();
    };

    const togglePath = (p) => {
        if (!setFormData) return;
        const cur = getIn(formData, p, false);
        setFormData((prev) => setIn(prev, p, !cur));
        clearError();
    };
    return (
        <div
            className={cn("flex flex-col gap-2 items-start", wrapperClassName)}
        >
            <p className="font-medium text-slate-700">{label}</p>

            {/* FILE */}
            {type === "file" ? (
                <div className="w-full">
                    <FileUpload
                        file={currentValue?.file || undefined}
                        existingFile={currentValue}
                        onFileChange={(file) => {
                            updateValue({
                                ...currentValue, // 기존 url, ext 정보 유지
                                file: file ?? null,
                                name: file ? file.name : currentValue?.name, // 새 파일명 반영
                            });
                        }}
                        onRemoveExisting={() => {
                            updateValue({
                                ...currentValue,
                                url: null,
                                name: "",
                                file: null,
                            });
                        }}
                        accept="image/*,.pdf"
                    />
                </div>
            ) : /* radio */ type === "radio" ? (
                <div className="w-full flex flex-col items-center justify-between gap-4 md:grid md:grid-cols-2 md:gap-5">
                    {options?.map((option) => {
                        const checked = currentValue === option.value;
                        return (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => updateValue(option.value)}
                                className={`
                  w-full border border-2 flex flex-col items-start justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
                  ${
                      checked
                          ? "border-sky-300 bg-sky-100 text-slate-700 shadow-sm font-medium"
                          : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800 font-normal"
                  }
                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-2 mb-1 w-full">
                                    {checked ? (
                                        <div className="rounded-full bg-sky-400 w-4 h-4" />
                                    ) : (
                                        <div className="rounded-full border-2 border-slate-400 w-4 h-4" />
                                    )}
                                    <span className="font-medium text-xs md:text-sm">
                                        {option.label}
                                    </span>
                                </div>

                                {option.description && (
                                    <p className="text-xs md:text-sm text-sky-600">
                                        {option.description}
                                    </p>
                                )}
                                {option.detail && (
                                    <p className="text-start text-xs text-slate-500">
                                        {option.detail}
                                    </p>
                                )}
                            </motion.button>
                        );
                    })}

                    {errorKey && errors?.[errorKey] && (
                        <p className="text-red-500 text-sm">
                            {errors?.[errorKey]}
                        </p>
                    )}
                </div>
            ) : /* CHECKBOX MULTI (옵션별 path 토글) */
            type === "checkbox" ? (
                <div className="flex flex-wrap gap-3">
                    {options?.map((opt, idx) => {
                        const checked = !!getIn(formData, opt.path, false);

                        return (
                            <motion.button
                                key={opt.path ?? idx}
                                type="button"
                                onClick={() => togglePath(opt.path)}
                                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
                  ${
                      checked
                          ? "border-sky-300 bg-sky-100 font-medium"
                          : "border-slate-200 bg-white text-slate-600 hover:text-slate-800 font-normal"
                  }
                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {checked ? (
                                    <CheckCircleActive />
                                ) : (
                                    <CheckCircle />
                                )}
                                <span className="font-medium text-xs md:text-sm">
                                    {opt.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            ) : (
                /* TEXT */
                <Input
                    type={type}
                    className="h-12"
                    value={currentValue ?? ""}
                    onChange={(e) => updateValue(e.target.value)}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    maxLength={maxLength}
                />
            )}
        </div>
    );
};
