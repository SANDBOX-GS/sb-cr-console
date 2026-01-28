/**
 * utils/formHelpers.js
 * 데이터 변환 및 정제 관련 유틸리티 함수 모음
 */

// Boolean/String -> 'Y' / 'N' 변환
export const toYn = (v) => {
    if (v === true || v === "true") return "Y";
    if (v === false || v === "false") return "N";
    if (v === "Y" || v === "N") return v;
    return "N"; // 기본값 (상황에 따라 null 리턴도 고려)
};

// 빈 문자열 -> null 변환 (DB 저장용)
export const nullIfEmpty = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
};

// 동의 만료일 계산
export const calculateExpirationDate = (consentType) => {
    const date = new Date();
    if (consentType === "30days") {
        date.setDate(date.getDate() + 30);
    }
    return date.toISOString().split('T')[0];
};