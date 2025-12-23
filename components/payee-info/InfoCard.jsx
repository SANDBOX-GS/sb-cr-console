"use client";

import { cn } from "@/lib/utils";
import { Box } from "../common/Box";
import { Input } from "../ui/input";
import { motion } from "framer-motion";
import { CheckCircleActive } from "../icon/CheckCircleActive";
import { CheckCircle } from "../icon/CheckCircle";
import { getIn, setIn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import FileUpload from "../ui/file-upload";

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
              className={cn("text-slate-500", isOpen ? "rotate-180" : "")}
            >
              <ChevronDown />
            </button>
          )}
        </div>
        {isOpen && (
          <div className={cn("flex flex-col gap-4")}>
            {mode === "view" &&
              Info.map((info, index) => <InfoView key={index} {...info} />)}
            {mode === "edit" &&
              Info.map((info, index) => (
                <>
                  {console.log(info.label, info.readOnly)}
                  <InfoEdit
                    key={index}
                    {...info}
                    formData={formData}
                    setFormData={setFormData}
                    errors={errors}
                    setErrors={setErrors}
                  />
                </>
              ))}
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
}) => {
  return (
    <div className="flex flex-row gap-2 items-center justify-between">
      <p className="font-medium text-base text-slate-700">{label}</p>
      <p className="font-normal text-base text-slate-500">{value}</p>
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
    <div className="flex flex-col gap-2 items-start">
      <p className="font-medium text-base text-slate-700">{label}</p>

      {/* RADIO */}
      {type === "file" ? (
        <div className="w-full">
          <FileUpload
            label={""}
            file={formData.files}
            onFileChange={""}
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
                  <span className="font-medium text-sm">{option.label}</span>
                </div>

                {option.description && (
                  <p className="text-sm text-sky-600">{option.description}</p>
                )}
                {option.detail && (
                  <p className="text-xs text-slate-500">{option.detail}</p>
                )}
              </motion.button>
            );
          })}

          {errorKey && errors?.[errorKey] && (
            <p className="text-red-500 text-sm">{errors?.[errorKey]}</p>
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
                {checked ? <CheckCircleActive /> : <CheckCircle />}
                <span className="font-medium text-sm">{opt.label}</span>
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
        />
      )}
    </div>
  );
};
