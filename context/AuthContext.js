"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const router = useRouter();

    const checkAuthStatus = async () => {
        try {
            // 이 API는 쿠키를 확인하여 로그인 상태를 반환해야 합니다.
            const response = await fetch('/api/member/status', {
                credentials: 'include',
            });
            if (response.ok) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error("Failed to check auth status:", error);
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = () => {
        setIsLoggedIn(true);
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
        <AuthContext.Provider value={{ isLoggedIn, login, logout, isLoading }}>
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