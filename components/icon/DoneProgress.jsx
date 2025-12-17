import { cn } from "@/lib/utils"; // 없으면 아래 cn 없이 className 문자열로만 써도 됨
import { CheckIcon } from "./CheckIcon";
import { CircleIcon } from "./CircleIcon";

const stepOrder = ["submitted", "review", "applied"];

const getState = (current, key) => {
  const curIdx = stepOrder.indexOf(current);
  const idx = stepOrder.indexOf(key);
  if (idx < curIdx) return "done";
  if (idx === curIdx) return "active";
  return "todo";
};

export const DoneProgress = ({ current, items }) => {
  return (
    <div className="w-full">
      {/* Indicator + line wrapper */}
      <div className="relative w-full">
        {/* ✅ 1) 라인: 부모 전체에 깔고, 좌우는 아이콘 반지름만큼 패딩 */}
        <div className="absolute left-0 right-0 top-5 md:top-[22px]">
          <div className="px-[32px] md:px-[58px]">
            <div className="h-1 w-full bg-primary-gradient rounded-full z-0" />
          </div>
        </div>

        {/* ✅ 2) 라인 진행 상태(선택): done/active 앞까지 채우기 */}
        <div className="absolute left-0 right-0 top-5 md:top-[22px]">
          <div className="px-[18px] md:px-[22px]">
            <div
              className="h-[2px] rounded-full bg-sky-300"
              style={{
                width: `${Math.max(
                  0,
                  (stepOrder.indexOf(current) / (items.length - 1)) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        {/* ✅ 3) 노드: justify-between으로 끝까지 꽉 채움 (우측 빈공간 제거) */}
        <ol className="flex w-full justify-between">
          {items.map((item) => {
            const state = getState(current, item.key);

            return (
              <li key={item.key} className="flex flex-col items-center z-10">
                <div
                  className={cn(
                    "w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-white",
                    state === "done" && "bg-sky-500 shadow-sm",
                    state === "active" && "ring-2 ring-sky-500",
                    state === "todo" && "ring-1 ring-slate-200"
                  )}
                >
                  {/* 아이콘 자체도 breakpoint로 크기 명시 */}
                  {state === "active" ? <CheckIcon /> : <CircleIcon />}
                </div>
                <div className="mt-4 text-center w-full max-w-[240px]">
                  <p
                    className={cn(
                      "text-base whitespace-nowrap text-slate-700 font-medium"
                    )}
                  >
                    {item.title}
                  </p>

                  {item.desc && (
                    <p className="hidden md:block mt-1 text-sm text-slate-500 whitespace-nowrap">
                      {item.desc}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
