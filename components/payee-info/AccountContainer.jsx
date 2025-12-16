import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "../icon/CheckCircle";
import { CheckCircleActive } from "../icon/CheckCircleActive";
import { Select } from "@/components/ui/select";
import { ID_DOCUMENT_TYPES, KOREAN_BANKS } from "@/constants/payee-data";
import FileUpload from "@/components/ui/file-upload";
import {
    formatPhoneNumber,
    formatBusinessNumber,
    formatIdNumber,
} from "@/utils/formatters";
import { Button } from "../common/Button";
import { Box } from "../common/Box";

export const AccountContainer = ({
                                     handleTabChange,
                                     setFormData,
                                     formData,
                                     errors,
                                 }) => {
    console.log("AccountContainer formData:", formData);

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
        >
            <Box className="space-y-6">
                <h4>사업자 구분</h4>
                {/* Business Type Selection - Chip UI */}
                <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
                    <Label>사업자 구분 *</Label>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { value: "individual", label: "개인" },
                            { value: "sole_proprietor", label: "개인사업자" },
                            { value: "corporate_business", label: "법인사업자" },
                        ].map((option) => (
                            <motion.button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        recipientInfo: {
                                            ...prev.recipientInfo,
                                            biz_type: option.value,
                                        },
                                    }));
                                }}
                                className={`
                            border border-1 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200
                            ${
                                    formData?.recipientInfo.biz_type === option.value
                                        ? "border-sky-300 bg-sky-100 text-slate-700 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800"
                                }
                          `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {formData?.recipientInfo.biz_type === option.value ? (
                                    <div className="rounded-full bg-sky-400 w-4 h-4"></div>
                                ) : (
                                    <div className="rounded-full border-2 border-slate-400 w-4 h-4"></div>
                                )}
                                <span className="font-medium text-sm">{option.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
                {/* Additional Options for Individual - Chip UI */}
                {formData?.recipientInfo.biz_type === "individual" && (
                    <div className="space-y-4 p-4 bg-sky-50 rounded-xl">
                        <Label>추가 옵션</Label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                {
                                    key: "is_overseas",
                                    label: "해외 거주자",
                                    checked: formData.recipientInfo.is_overseas,
                                },
                                {
                                    key: "is_minor",
                                    label: "미성년자 (법정대리인 필요)",
                                    checked: formData.recipientInfo.is_minor,
                                },
                                {
                                    key: "is_foreigner",
                                    label: "외국인",
                                    checked: formData.recipientInfo.is_foreigner,
                                },
                            ].map((option) => (
                                <motion.button
                                    key={option.key}
                                    type="button"
                                    onClick={() => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            recipientInfo: {
                                                ...prev.recipientInfo,
                                                [option.key]: !prev.recipientInfo[option.key],
                                            },
                                        }));
                                    }}
                                    className={`
                              flex items-center gap-2 px-4 py-2.5 rounded-xl border border-1 transition-all duration-200
                              ${
                                        option.checked
                                            ? "border-sky-300 bg-sky-100 text-slate-700 shadow-sm"
                                            : "border-slate-200 bg-white hover:border-slate-300 text-slate-600 hover:text-slate-800"
                                    }
                            `}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {option.checked ? <CheckCircleActive /> : <CheckCircle />}
                                    <span className="font-medium text-sm">{option.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}
            </Box>
            {/* Business Information (for business types) */}
            {(formData?.recipientInfo.biz_type === "sole_proprietor" ||
                formData?.recipientInfo.biz_type === "corporate_business") && (
                <Box className="space-y-6">
                    <h4>사업자 정보</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="business_name">
                                {formData.recipientInfo.biz_type === "corporate_business"
                                    ? "법인명"
                                    : "상호명"}{" "}
                                *
                            </Label>
                            <Input
                                id="business_name"
                                type="text"
                                placeholder={
                                    formData.recipientInfo.biz_type === "corporate_business"
                                        ? "법인명을 입력하세요"
                                        : "상호명을 입력하세요"
                                }
                                value={formData.recipientInfo.business_name || ""}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        recipientInfo: {
                                            ...prev.recipientInfo,
                                            business_name: e.target.value,
                                        },
                                    }));
                                    if (errors.business_name)
                                        setErrors((prev) => ({
                                            ...prev,
                                            business_name: "",
                                        }));
                                }}
                                className={`h-12 bg-white/50 ${
                                    errors.business_name ? "border-red-400" : ""
                                }`}
                            />
                            {errors.business_name && (
                                <p className="text-red-500 text-sm">{errors.business_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="business_number">
                                {formData.recipientInfo.biz_type === "corporate_business"
                                    ? "법인등록번호"
                                    : "사업자등록번호"}{" "}
                                *
                            </Label>
                            <Input
                                id="business_number"
                                type="text"
                                placeholder="000-00-00000"
                                value={formData.recipientInfo.business_number || ""}
                                onChange={(e) => {
                                    const formatted = formatBusinessNumber(e.target.value);
                                    setFormData((prev) => ({
                                        ...prev,
                                        recipientInfo: {
                                            ...prev.recipientInfo,
                                            business_number: formatted,
                                        },
                                    }));
                                    if (errors.business_number)
                                        setErrors((prev) => ({
                                            ...prev,
                                            business_number: "",
                                        }));
                                }}
                                className={`h-12 bg-white/50 ${
                                    errors.business_number ? "border-red-400" : ""
                                }`}
                                maxLength={12}
                            />
                            {errors.business_number && (
                                <p className="text-red-500 text-sm">{errors.business_number}</p>
                            )}
                        </div>
                    </div>

                    <FileUpload
                        label={
                            formData.recipientInfo.biz_type === "corporate_business"
                                ? "법인등록증"
                                : "사업자등록증"
                        }
                        file={formData.files.business_document}
                        onFileChange={(file) =>
                            setFormData((prev) => ({
                                ...prev,
                                files: { ...prev.files, business_document: file },
                            }))
                        }
                        accept="image/*,.pdf"
                    />
                </Box>
            )}

            {/* Individual Information */}
            {formData?.recipientInfo.biz_type === "individual" && (
                <Box className="space-y-6">
                    <h4>개인 정보</h4>

                    {/* 본인 정보 - 외국인/내국인에 따라 다른 입력 필드 */}
                    <div className="space-y-6">
                        {formData?.recipientInfo.is_foreigner ? (
                            // 외국인인 경우 외국인등록번호 입력
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="foreigner_name">본명 *</Label>
                                    <Input
                                        id="foreigner_name"
                                        type="text"
                                        placeholder="본명을 입력하세요"
                                        value={formData.recipientInfo.foreigner_name || ""}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                recipientInfo: {
                                                    ...prev.recipientInfo,
                                                    foreigner_name: e.target.value,
                                                },
                                            }));
                                            if (errors.foreigner_name)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    foreigner_name: "",
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 ${
                                            errors.foreigner_name ? "border-red-400" : ""
                                        }`}
                                    />
                                    {errors.foreigner_name && (
                                        <p className="text-red-500 text-sm">
                                            {errors.foreigner_name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="foreigner_registration_number">
                                        외국인등록번호 *
                                    </Label>
                                    <Input
                                        id="foreigner_registration_number"
                                        type="text"
                                        placeholder="000000-0000000"
                                        value={
                                            formData.recipientInfo.foreigner_registration_number || ""
                                        }
                                        onChange={(e) => {
                                            const formatted = formatIdNumber(e.target.value);
                                            setFormData((prev) => ({
                                                ...prev,
                                                recipientInfo: {
                                                    ...prev.recipientInfo,
                                                    foreigner_registration_number: formatted,
                                                },
                                            }));
                                            if (errors.foreigner_registration_number)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    foreigner_registration_number: "",
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 ${
                                            errors.foreigner_registration_number
                                                ? "border-red-400"
                                                : ""
                                        }`}
                                        maxLength={14}
                                    />
                                    {errors.foreigner_registration_number && (
                                        <p className="text-red-500 text-sm">
                                            {errors.foreigner_registration_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // 내국인인 경우 주민등록번호 입력
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="real_name">본명 *</Label>
                                    <Input
                                        id="real_name"
                                        type="text"
                                        placeholder="본명을 입력하세요"
                                        value={formData.recipientInfo.real_name || ""}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                recipientInfo: {
                                                    ...prev.recipientInfo,
                                                    real_name: e.target.value,
                                                },
                                            }));
                                            if (errors.real_name)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    real_name: "",
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 ${
                                            errors.real_name ? "border-red-400" : ""
                                        }`}
                                    />
                                    {errors.real_name && (
                                        <p className="text-red-500 text-sm">{errors.real_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="id_number">주민등록번호 *</Label>
                                    <Input
                                        id="id_number"
                                        type="text"
                                        placeholder="000000-0000000"
                                        value={formData.recipientInfo.id_number || ""}
                                        onChange={(e) => {
                                            const formatted = formatIdNumber(e.target.value);
                                            setFormData((prev) => ({
                                                ...prev,
                                                recipientInfo: {
                                                    ...prev.recipientInfo,
                                                    id_number: formatted,
                                                },
                                            }));
                                            if (errors.id_number)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    id_number: "",
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 ${
                                            errors.id_number ? "border-red-400" : ""
                                        }`}
                                        maxLength={14}
                                    />
                                    {errors.id_number && (
                                        <p className="text-red-500 text-sm">{errors.id_number}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 신분증 종류 선택 (미성년자가 아닌 내국인만) */}
                        {!formData.recipientInfo.is_foreigner &&
                            !formData.recipientInfo.is_minor && (
                                <div className="space-y-2">
                                    <Label htmlFor="id_document_type">신분증 종류 *</Label>
                                    <Select
                                        value={formData.recipientInfo.id_document_type}
                                        options={ID_DOCUMENT_TYPES}
                                        placeholder="신분증 종류를 선택하세요"
                                        error={errors.id_document_type}
                                        onValueChange={(value) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                recipientInfo: {
                                                    ...prev.recipientInfo,
                                                    id_document_type: value,
                                                },
                                            }));
                                            if (errors.id_document_type) {
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    id_document_type: "",
                                                }));
                                            }
                                        }}
                                    />
                                    {errors.id_document_type && (
                                        <p className="text-red-500 text-sm">
                                            {errors.id_document_type}
                                        </p>
                                    )}
                                </div>
                            )}

                        {/* 신분증 업로드 */}
                        {/* 미성년자가 아닌 경우에만 신분증 업로드 표시 */}
                        {!formData.recipientInfo.is_minor && (
                            <FileUpload
                                label={
                                    formData.recipientInfo.is_foreigner
                                        ? "외국인등록증"
                                        : "신분증"
                                }
                                file={formData.files.id_document}
                                onFileChange={(file) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        files: { ...prev.files, id_document: file },
                                    }))
                                }
                                accept="image/*,.pdf"
                            />
                        )}
                    </div>

                    {/* 미성년자인 경우 법정대리인 정보 */}
                    {formData.recipientInfo.is_minor && (
                        <div className="space-y-6">
                            <h4>법정대리인 정보</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="guardian_name">법정대리인 본명 *</Label>
                                    <Input
                                        id="guardian_name"
                                        type="text"
                                        placeholder="법정대리인 본명을 입력하세요"
                                        value={formData.recipientInfo.guardian_name || ""}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                recipientInfo: {
                                                    ...prev.recipientInfo,
                                                    guardian_name: e.target.value,
                                                },
                                            }));
                                            if (errors.guardian_name)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    guardian_name: "",
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 ${
                                            errors.guardian_name ? "border-red-400" : ""
                                        }`}
                                    />
                                    {errors.guardian_name && (
                                        <p className="text-red-500 text-sm">
                                            {errors.guardian_name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="guardian_phone">법정대리인 연락처 *</Label>
                                    <Input
                                        id="guardian_phone"
                                        type="text"
                                        placeholder="010-0000-0000"
                                        value={formData.recipientInfo.guardian_phone || ""}
                                        onChange={(e) => {
                                            const formatted = formatPhoneNumber(e.target.value);
                                            setFormData((prev) => ({
                                                ...prev,
                                                recipientInfo: {
                                                    ...prev.recipientInfo,
                                                    guardian_phone: formatted,
                                                },
                                            }));
                                            if (errors.guardian_phone)
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    guardian_phone: "",
                                                }));
                                        }}
                                        className={`h-12 bg-white/50 ${
                                            errors.guardian_phone ? "border-red-400" : ""
                                        }`}
                                        maxLength={13}
                                    />
                                    {errors.guardian_phone && (
                                        <p className="text-red-500 text-sm">
                                            {errors.guardian_phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <FileUpload
                                label="가족관계증명서"
                                file={formData.files.family_relation_certificate}
                                onFileChange={(file) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        files: {
                                            ...prev.files,
                                            family_relation_certificate: file,
                                        },
                                    }))
                                }
                                accept="image/*,.pdf"
                            />
                        </div>
                    )}
                </Box>
            )}

            {/* Account Information */}
            <Box className="space-y-6">
                <h4>계좌 정보</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="bank_name">은행명 *</Label>
                        <Select
                            value={formData?.accountInfo.bank_name}
                            options={KOREAN_BANKS}
                            onValueChange={(value) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    accountInfo: {
                                        ...prev.accountInfo,
                                        bank_name: value,
                                    },
                                }));
                                if (errors?.bank_name)
                                    setErrors((prev) => ({ ...prev, bank_name: "" }));
                            }}
                            error={errors?.bank_name}
                        />
                        {errors?.bank_name && (
                            <p className="text-red-500 text-sm">{errors.bank_name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_holder">예금주 *</Label>
                        <Input
                            id="account_holder"
                            type="text"
                            placeholder="예금주를 입력하세요"
                            value={formData?.accountInfo.account_holder}
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    accountInfo: {
                                        ...prev.accountInfo,
                                        account_holder: e.target.value,
                                    },
                                }));
                                if (errors.account_holder)
                                    setErrors((prev) => ({
                                        ...prev,
                                        account_holder: "",
                                    }));
                            }}
                            className={`h-12 bg-white/50 ${
                                errors?.account_holder ? "border-red-400" : ""
                            }`}
                        />
                        {errors?.account_holder && (
                            <p className="text-red-500 text-sm">{errors.account_holder}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="account_number">계좌번호 *</Label>
                        <Input
                            id="account_number"
                            type="text"
                            placeholder="계좌번호를 입력하세요"
                            value={formData?.accountInfo.account_number}
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    accountInfo: {
                                        ...prev.accountInfo,
                                        account_number: e.target.value,
                                    },
                                }));
                                if (errors.account_number)
                                    setErrors((prev) => ({
                                        ...prev,
                                        account_number: "",
                                    }));
                            }}
                            className={`h-12 bg-white/50 ${
                                errors?.account_number ? "border-red-400" : ""
                            }`}
                        />
                        {errors?.account_number && (
                            <p className="text-red-500 text-sm">{errors.account_number}</p>
                        )}
                    </div>
                </div>

                {/* 해외 거주자인 경우 추가 정보 */}
                {formData?.recipientInfo.is_overseas && (
                    <div className="space-y-6">
                        <h4>해외 계좌 추가 정보</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="swift_code">SWIFT CODE *</Label>
                                <Input
                                    id="swift_code"
                                    type="text"
                                    placeholder="SWIFT CODE를 입력하세요"
                                    value={formData.accountInfo.swift_code || ""}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            accountInfo: {
                                                ...prev.accountInfo,
                                                swift_code: e.target.value,
                                            },
                                        }));
                                        if (errors.swift_code)
                                            setErrors((prev) => ({
                                                ...prev,
                                                swift_code: "",
                                            }));
                                    }}
                                    className={`h-12 bg-white/50 ${
                                        errors.swift_code ? "border-red-400" : ""
                                    }`}
                                />
                                {errors.swift_code && (
                                    <p className="text-red-500 text-sm">{errors.swift_code}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bank_address">은행 주소 *</Label>
                                <Input
                                    id="bank_address"
                                    type="text"
                                    placeholder="은행 주소를 입력하세요"
                                    value={formData.accountInfo.bank_address || ""}
                                    onChange={(e) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            accountInfo: {
                                                ...prev.accountInfo,
                                                bank_address: e.target.value,
                                            },
                                        }));
                                        if (errors.bank_address)
                                            setErrors((prev) => ({
                                                ...prev,
                                                bank_address: "",
                                            }));
                                    }}
                                    className={`h-12 bg-white/50 ${
                                        errors.bank_address ? "border-red-400" : ""
                                    }`}
                                />
                                {errors.bank_address && (
                                    <p className="text-red-500 text-sm">{errors.bank_address}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 통장 사본 업로드 */}
                <div className="space-y-2">
                    <FileUpload
                        label="통장 사본"
                        file={formData?.files.bank_document}
                        onFileChange={(file) =>
                            setFormData((prev) => ({
                                ...prev,
                                files: { ...prev.files, bank_document: file },
                            }))
                        }
                        accept="image/*,.pdf"
                    />
                </div>
            </Box>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 w-full gap-8">
                <Button
                    type="button"
                    variant="line"
                    onClick={() => handleTabChange("guide")}
                    className="w-full"
                >
                    이전
                </Button>
                <Button
                    type="button"
                    onClick={() => handleTabChange("tax")}
                    className="w-full"
                >
                    다음
                </Button>
            </div>
        </motion.div>
    );
};