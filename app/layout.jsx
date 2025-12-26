import "./globals.css";
import "./notion-overrides.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { Suspense } from "react";

export const metadata = {
    title: "크리에이터 정산 시스템",
    description:
        "샌드박스의 협업 파트너와 함께하는 크리에이터 정산 시스템입니다.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body className="min-h-screen flex flex-col">
                <AuthProvider>
                    <Header className="sticky top-0 z-50 shrink-0 bg-white" />
                    <main className="flex-1 min-h-0 py-20 px-5">
                        <Suspense fallback={<div>Loading Page...</div>}>
                            {children}
                        </Suspense>
                    </main>

                    <Toaster />
                    <Footer className="shrink-0" />
                </AuthProvider>
            </body>
        </html>
    );
}
