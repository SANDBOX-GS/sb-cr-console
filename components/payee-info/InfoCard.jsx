"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Box } from "../common/Box";
import { Input } from "../ui/input";
import { motion } from "framer-motion";
import { CheckCircleActive } from "../icon/CheckCircleActive";
import { CheckCircle } from "../icon/CheckCircle";
import { getIn, setIn } from "@/lib/utils";
import { ChevronDown, ExternalLinkIcon, FileText, Download } from "lucide-react";
import FileUpload from "../ui/file-upload";
import { Button } from "../common/Button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogDescription,
    DialogTitle,
} from "../ui/dialog";
import Image from "next/image";
import { IMG_URL } from "@/constants/dbConstants";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

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
    // 1. 파일 데이터 파싱
    const hasFile = type === "file" && src && src.url;
    const fileExt = src?.ext?.toLowerCase() || "";
    const fileName = src?.name || value || "파일";

    // 2. URL 조합
    const fullUrl = hasFile
        ? (src.url.startsWith("http") ? src.url : `${IMG_URL}${src.url}`)
        : "";

    // 3. 파일 타입 판별
    const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(fileExt);
    const isPdf = fileExt === "pdf";

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
            {hasFile ? (
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="truncate flex-1 min-w-0 text-right text-[#717182] font-normal leading-[1.6] text-[0.8125rem] md:text-base">
                        {fileName}
                    </div>
                    <Dialog>
                        <DialogTrigger asChild className="w-auto">
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

                        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white">

                            <DialogHeader className="px-6 py-4 border-b bg-white flex flex-row items-center justify-between shrink-0 space-y-0">
                                <DialogTitle className="truncate pr-4 text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <FileText size={20} className="text-slate-400" />
                                    <span className="truncate">{label}</span>
                                </DialogTitle>

                                {/*<a*/}
                                {/*    href={fullUrl}*/}
                                {/*    target="_blank"*/}
                                {/*    rel="noopener noreferrer"*/}
                                {/*    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-md shrink-0"*/}
                                {/*    download*/}
                                {/*>*/}
                                {/*    <Download size={16} />*/}
                                {/*    <span className="hidden sm:inline">원본 다운로드</span>*/}
                                {/*</a>*/}
                            </DialogHeader>

                            <div className="flex-1 w-full h-full relative bg-slate-50 overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center">
                                    {isImage ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={fullUrl}
                                                alt={fileName}
                                                fill
                                                className="object-contain"
                                                priority
                                            />
                                        </div>
                                    ) : isPdf ? (
                                        // ★ [핵심] 구글 독스 뷰어로 감싸서 보여주기
                                        // 이렇게 하면 브라우저 PDF 플러그인 없이도 무조건 보입니다.
                                        <iframe
                                            src={`https://docs.google.com/gview?url=${fullUrl}&embedded=true`}
                                            title={fileName}
                                            className="w-full h-full border-none bg-white"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-500">
                                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                                                <FileText size={32} className="text-slate-400" />
                                            </div>
                                            <p>이 파일 형식은 미리보기를 지원하지 않습니다.</p>
                                            <Button
                                                variant="primary"
                                                onClick={() => window.open(fullUrl, '_blank')}
                                            >
                                                파일 다운로드
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <div className="text-[#717182] font-normal leading-[1.6] text-[0.8125rem] md:text-base">{value || "-"}</div>
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
            className={cn(
                "flex flex-col gap-2 items-start",
                type === "checkbox"
                    ? "bg-slate-50 rounded-lg p-3 border-slate-100 border"
                    : "",
                wrapperClassName
            )}
        >
            <p className="font-medium text-slate-700">{label}</p>

            {/* FILE */}
            {type === "select" ? (
                <div className="w-full">
                    <Select
                        value={currentValue ?? ""}
                        onValueChange={(value) => updateValue(value)}
                        disabled={readOnly}
                    >
                        <SelectTrigger
                            className={cn(
                                "h-12 bg-white/50",
                                errorKey &&
                                    errors?.[errorKey] &&
                                    "border-red-400"
                            )}
                        >
                            <SelectValue
                                placeholder={placeholder ?? "선택해주세요"}
                            />
                        </SelectTrigger>

                        <SelectContent>
                            {options?.map((opt) => {
                                const value =
                                    typeof opt === "string" ? opt : opt.value;
                                const label =
                                    typeof opt === "string" ? opt : opt.label;

                                return (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>

                    {errorKey && errors?.[errorKey] && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors[errorKey]}
                        </p>
                    )}
                </div>
            ) : type === "file" ? (
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
