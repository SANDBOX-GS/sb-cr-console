import "./globals.css";
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
      <body>
        <AuthProvider>
          <Header />
          <div className="min-h-screen flex flex-col py-20 px-5">
            <Suspense fallback={<div>Loading Page...</div>}>
              {children}
            </Suspense>
          </div>

          <Toaster />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
