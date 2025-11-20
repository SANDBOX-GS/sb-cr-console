/**
 * 전화번호 포맷팅 함수
 * @param {string} value 입력된 전화번호 문자열
 * @returns {string} 포맷된 전화번호 (000-0000-0000)
 */
export const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    // 11자리 (010-0000-0000) 기준으로 포맷팅하고 13자리(하이픈 포함)로 자름
    return digits
        .replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
        .substring(0, 13);
};

/**
 * 사업자번호 포맷팅 함수
 * @param {string} value 입력된 사업자번호 문자열
 * @returns {string} 포맷된 사업자번호 (000-00-00000)
 */
export const formatBusinessNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    // 10자리 (3-2-5 형식) 기준으로 포맷팅하고 12자리(하이픈 포함)로 자름
    return digits
        .replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3")
        .substring(0, 12);
};

/**
 * 주민등록번호 포맷팅 함수
 * @param {string} value 입력된 주민등록번호 문자열
 * @returns {string} 포맷된 주민등록번호 (000000-0000000)
 */
export const formatIdNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    // 13자리 (6-7 형식) 기준으로 포맷팅하고 14자리(하이픈 포함)로 자름
    return digits
        .replace(/(\d{6})(\d{7})/, "$1-$2")
        .substring(0, 14);
};

/**
 * 계좌번호 마스킹 함수
 * @param {string} accountNumber 계좌번호
 * @returns {string} 마스킹된 계좌번호 (****1234)
 */
export const maskAccountNumber = (accountNumber) => {
    if (accountNumber.length <= 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    // 계좌번호 전체 길이에서 마지막 4자리를 제외하고 마스킹 처리
    const masked = "*".repeat(accountNumber.length - 4);
    return masked + lastFour;
};

/**
 * 주민등록번호 마스킹 함수
 * @param {string} idNumber 주민등록번호
 * @returns {string} 마스킹된 주민등록번호 (123456-1******)
 */
export const maskIdNumber = (idNumber) => {
    if (!idNumber || idNumber.length < 8) return idNumber;
    // 앞 6자리, 하이픈, 뒷자리 중 첫 번째 숫자만 보이고 나머지는 마스킹
    return idNumber.replace(
        /(\d{6})-(\d{1})\d{6}/,
        "$1-$2******",
    );
};

/**
 * 날짜 포맷팅 함수 (한국어)
 * @param {Date} date Date 객체
 * @returns {string} 포맷된 날짜 (2024.12.05)
 */
export const formatDate = (date) => {
    return date
        .toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        // '2024. 12. 05.' 에서 불필요한 공백과 마침표 제거
        .replace(/\. /g, ".")
        .replace(/\.$/, "");
};

/**
 * 날짜+시간 포맷팅 함수 (한국어)
 * @param {Date} date Date 객체
 * @returns {string} 포맷된 날짜시간 (2024.12.05 14:30)
 */
export const formatDateTime = (date) => {
    return date
        .toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
        // '2024. 12. 05. 오후 2:30' 형태를 '2024.12.05 14:30' 형태로 변경할 수도 있지만,
        // toLocaleDateString 자체의 기본 24시간 표기 결과를 그대로 사용합니다.
        .replace(/\. /g, ".")
        .replace(/\.$/, "");
};