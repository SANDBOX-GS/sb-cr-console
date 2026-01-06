import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * 일반 JavaScript 객체를 FormData 객체로 변환합니다.
 * 이 함수는 중첩된 객체와 파일 객체를 재귀적으로 처리합니다.
 *
 * @param {object} obj - 변환할 객체.
 * @param {FormData} [formData] - (재귀용) 기존 FormData 인스턴스.
 * @param {string} [parentKey] - (재귀용) 중첩된 객체의 부모 키.
 * @returns {FormData} 변환된 FormData 객체.
 */
export function objectToFormData(
  obj,
  formData = new FormData(),
  parentKey = ""
) {
  // 객체의 모든 키를 순회합니다.
  for (const key in obj) {
    // hasOwnProperty 체크는 프로토타입 체인의 속성을 제외하기 위함입니다.
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // 현재 처리 중인 속성의 전체 키 경로를 생성합니다.
      // 예: parentKey가 'recipientInfo'이고 key가 'name'이면, 'recipientInfo[name]'이 됩니다.
      const propName = parentKey ? `${parentKey}[${key}]` : key;
      const value = obj[key];

      // 값이 파일(File) 객체인 경우
      if (value instanceof File) {
        formData.append(propName, value);
      }
      // 값이 null이 아닌 객체이고 파일이 아닌 경우 (중첩된 객체 또는 배열)
      else if (
        typeof value === "object" &&
        value !== null &&
        !(value instanceof File)
      ) {
        // 재귀적으로 함수를 호출하여 중첩된 객체를 처리합니다.
        objectToFormData(value, formData, propName);
      }
      // 그 외의 모든 값 (string, number, boolean, null)
      else {
        // null이나 undefined인 경우 빈 문자열로 처리하거나 필요에 따라 다르게 처리할 수 있습니다.
        formData.append(propName, value ?? "");
      }
    }
  }
  return formData;
}

export const getIn = (obj, path, fallback) => {
  return (
    path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj) ??
    fallback
  );
};

export const setIn = (obj, path, value) => {
  const keys = path.split(".");
  const next = { ...obj };
  let cur = next;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = { ...(cur[k] ?? {}) };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return next;
};

// 주민등록번호(외국인등록번호) 입력 정규식
export const formatSSN = (val) => {
    if (!val) return "";
    const onlyNums = val.replace(/\D/g, ""); // 숫자만 남김
    const limited = onlyNums.slice(0, 13);   // 13자리 제한

    // 6자리 넘어가면 하이픈 추가
    if (limited.length > 6) {
        return `${limited.slice(0, 6)}-${limited.slice(6)}`;
    }
    return limited;
};

// [추가] UUID 생성 함수
export function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}