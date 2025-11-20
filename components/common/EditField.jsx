import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * @typedef {object} EditFieldProps
 * @property {string} label 입력 필드의 레이블입니다.
 * @property {string} value 현재 입력 값입니다.
 * @property {(value: string) => void} onChange 입력 값 변경 핸들러입니다.
 * @property {boolean} [required=false] 필수 입력 여부입니다.
 * @property {string} [type='text'] 입력 필드 타입 (text, email, tel 등).
 * @property {string} [placeholder] 플레이스홀더 텍스트입니다.
 * @property {string} [error] 유효성 검사 오류 메시지입니다.
 * @property {string} [id] HTML ID 속성입니다. (없으면 label을 사용)
 */

/**
 * 표준 레이블과 오류 메시지를 포함한 단일 입력 필드 컴포넌트입니다.
 * @param {EditFieldProps} props
 */
export function EditField({
                              label,
                              value,
                              onChange,
                              required = false,
                              type = "text",
                              placeholder,
                              error,
                              id,
                          }) {
    const fieldId = id || label.replace(/\s/g, '_'); // ID를 생성하거나 레이블을 사용

    return (
        <div className="space-y-2">
            <Label htmlFor={fieldId} className="text-slate-600">
                {label}{" "}
                {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
                id={fieldId}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`bg-white/50 ${error ? "border-red-400" : ""}`}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
    );
}