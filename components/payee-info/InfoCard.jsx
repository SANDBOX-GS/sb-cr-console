"use client";

import { cn } from "@/lib/utils";
import { Box } from "../common/Box";
import { Input } from "../ui/input";
import { motion } from "framer-motion";
import { CheckCircleActive } from "../icon/CheckCircleActive";
import { CheckCircle } from "../icon/CheckCircle";
import { getIn, setIn } from "@/lib/utils";

export default function InfoBox({
  title = "수취 정보",
  className = "",
  children,
  mode = "edit",
  Info = [],
  formData,
  setFormData,
  errors = {},
  setErrors,
}) {
  console.log("카드레벨", Info);
  return (
    <div>
      <Box className={cn("flex flex-col gap-4", className)}>
        <h4>{title}</h4>
        <div className="flex flex-col gap-4 md:gap-5 md:grid md:grid-cols-2 md:gap-x-12">
          {mode === "view" &&
            Info.map((info, index) => <InfoView key={index} {...info} />)}
          {mode === "edit" &&
            Info.map((info, index) => (
              <InfoEdit
                key={index}
                {...info}
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                setErrors={setErrors}
              />
            ))}
        </div>

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
  label,
  id,
  type = "text",
  path,
  options,
  errorKey,
  formData,
  setFormData,
  errors,
  setErrors,
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
    setFormData((prev) => setIn(prev, path, next));
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
      {type === "radio" ? (
        <div className="flex items-center justify-between gap-4 flex-col md:grid md:grid-cols-2">
          {options?.map((option) => {
            const checked = currentValue === option.value;

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => updateValue(option.value)}
                className={`
                  w-full border border-2 flex flex-col items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-200
                  ${
                    checked
                      ? "border-sky-300 bg-sky-100 text-slate-700 shadow-sm font-medium"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800 font-normal"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-2 mb-1">
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
      ) : /* CHECKBOX (단일 bool) */
      type === "checkbox" ? (
        <div className="flex flex-wrap gap-3">
          {(() => {
            const checked = !!currentValue;

            return (
              <motion.button
                type="button"
                onClick={() => updateValue(!checked)}
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
                <span className="font-medium text-sm">동의</span>
              </motion.button>
            );
          })()}
        </div>
      ) : /* CHECKBOX MULTI (옵션별 path 토글) */
      type === "checkbox-multi" ? (
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
        />
      )}
    </div>
  );
};
