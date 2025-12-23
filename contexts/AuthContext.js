"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // 수취인 정보 유무 상태
    const [hasPayeeInfo, setHasPayeeInfo] = useState(false);

    const router = useRouter();

    const checkAuthStatus = async () => {
        try {
            // 이 API는 쿠키를 확인하여 로그인 상태를 반환해야 합니다.
            const response = await fetch('/api/member/status', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setIsLoggedIn(true);
                setHasPayeeInfo(data.hasPayeeInfo); // API가 준 값 저장
            } else {
                setIsLoggedIn(false);
                setHasPayeeInfo(false);
            }
        } catch (error) {
            console.error("Failed to check auth status:", error);
            setIsLoggedIn(false);
            setHasPayeeInfo(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = () => {
        setIsLoggedIn(true);
        // 로그인 직후에는 hasPayeeInfo를 모르므로, checkAuthStatus를 다시 호출하거나
        // 로그인 API에서 값을 받아와서 넘겨주는 것이 좋음.
        // 일단은 임시로 true 처리 후 페이지 이동 시 API가 다시 체크하게 됨.
        checkAuthStatus();
    };

    const logout = async () => {
        try {
            const response = await fetch('/api/member/logout', { method: 'POST' });
            if (response.ok) {
                console.log("Logout successful on server.");
            }
        } catch (error) {
            console.error("Logout API failed:", error);
        }
        setIsLoggedIn(false);
        setIsLoading(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            isLoggedIn,
            isLoading,
            hasPayeeInfo,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}