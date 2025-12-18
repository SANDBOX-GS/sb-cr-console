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
      <h1>404</h1>
      <IconCard
        h="Not Found"
        infoTitle="페이지를 찾을 수 없습니다."
        infoLi={["페이지 URL을 다시 확인해 주세요.", "새로운 "]}
        desc={[""]}
        icon={DocumentQuestion}
      />
      <Button className="w-[240px]" onClick={() => navigate("/")}>
        홈으로
      </Button>
    </div>
  );
};

export default UserNotFound;
