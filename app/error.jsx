"use client";
import { IconCard } from "@/components/common/IconCard";
import React from "react";
import { DocumentQuestion } from "@/components/icon/DocumentQuestion";
import { Button } from "@/components/common/Button";
import { useRouter } from "@/hooks/useRouter";

const UserNotFound = () => {
    const { navigate } = useRouter();
    return (
        <div className="w-full h-full flex flex-col items-center justify-center mt-40 gap-8">
            <h1>Error</h1>
            <IconCard
                h="Error: 오류 발생"
                infoLi={[
                    "예상하지 못한 오류가 발생했습니다.",
                    "다시 시도해 주세요.",
                ]}
                icon={DocumentQuestion}
            />
            <Button className="w-[240px]" onClick={() => navigate("/")}>
                홈으로
            </Button>
        </div>
    );
};

export default UserNotFound;
