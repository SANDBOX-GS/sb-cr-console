"use client";
import { useState, useEffect } from 'react';

/**
 * @description URL의 pathname과 searchParams를 관리하는 커스텀 라우터 훅입니다.
 */
export function useRouter() {
    const [pathname, setPathname] = useState(window.location.pathname);
    const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));

    useEffect(() => {
        const handlePopState = () => {
            setPathname(window.location.pathname);
            setSearchParams(new URLSearchParams(window.location.search));
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    /**
     * @description 새로운 페이지로 이동합니다.
     * @param {string} path 이동할 경로
     * @param {Record<string, string>} [params] URL에 추가할 검색 파라미터
     */
    const navigate = (path, params) => {
        const url = new URL(path, window.location.origin);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }

        window.history.pushState({}, '', url.toString());
        setPathname(url.pathname);
        setSearchParams(new URLSearchParams(url.search));
    };

    /**
     * @description 현재 URL의 검색 파라미터를 업데이트합니다.
     * @param {Record<string, string>} params 업데이트할 검색 파라미터
     */
    const updateSearchParams = (params) => {
        const newSearchParams = new URLSearchParams(searchParams);
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                newSearchParams.set(key, value);
            } else {
                newSearchParams.delete(key);
            }
        });

        const newUrl = `${pathname}?${newSearchParams.toString()}`;
        window.history.pushState({}, '', newUrl);
        setSearchParams(newSearchParams);
    };

    /**
     * @description 특정 키에 해당하는 검색 파라미터 값을 가져옵니다.
     * @param {string} key 가져올 검색 파라미터 키
     * @returns {string | null} 검색 파라미터 값
     */
    const getSearchParam = (key) => {
        return searchParams.get(key);
    };

    return {
        pathname,
        searchParams,
        navigate,
        updateSearchParams,
        getSearchParam
    };
}