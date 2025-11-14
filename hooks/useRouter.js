"use client";

import { useState, useCallback } from 'react';
import {
    useRouter as useNextRouter,
    usePathname,
    useSearchParams
} from 'next/navigation';

/**
 * @description Next.js App Router의 내장 기능을 사용하여 URL의 pathname과 searchParams를 관리하는 커스텀 라우터 훅입니다.
 */
export function useRouter() {
    // Next.js 내장 훅: 클라이언트 컴포넌트에서만 사용 가능
    const nextRouter = useNextRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams(); // Immutable URLSearchParams 객체와 유사한 객체 (단, toString() 메서드만 없음)

    /**
     * @description 새로운 페이지로 이동합니다.
     * @param {string} path 이동할 경로
     * @param {Record<string, string>} [params] URL에 추가할 검색 파라미터
     */
    const navigate = useCallback((path, params) => {
        // Next.js의 내장 push 기능을 사용
        if (params) {
            const newSearchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                newSearchParams.set(key, String(value));
            });
            nextRouter.push(`${path}?${newSearchParams.toString()}`);
        } else {
            nextRouter.push(path);
        }
    }, [nextRouter]);

    /**
     * @description 현재 URL의 검색 파라미터를 업데이트합니다.
     * @param {Record<string, string>} params 업데이트할 검색 파라미터
     */
    const updateSearchParams = useCallback((params) => {
        // Next.js의 searchParams는 Immutable이므로, URLSearchParams로 변환하여 사용
        const currentParams = new URLSearchParams(searchParams.toString());

        Object.entries(params).forEach(([key, value]) => {
            if (value || value === 0) {
                currentParams.set(key, String(value));
            } else {
                currentParams.delete(key);
            }
        });

        // push 대신 replace를 사용하는 것이 일반적입니다. (히스토리 스택에 불필요한 엔트리 방지)
        nextRouter.push(`${pathname}?${currentParams.toString()}`, { scroll: false });

    }, [nextRouter, pathname, searchParams]);

    /**
     * @description 특정 키에 해당하는 검색 파라미터 값을 가져옵니다.
     * @param {string} key 가져올 검색 파라미터 키
     * @returns {string | null} 검색 파라미터 값
     */
    const getSearchParam = useCallback((key) => {
        // useSearchParams 객체의 get() 메서드를 직접 사용
        return searchParams.get(key);
    }, [searchParams]);

    return {
        // Next.js 내장 훅의 반환값
        pathname,
        searchParams,
        // 커스텀 함수
        navigate,
        updateSearchParams,
        getSearchParam
    };
}