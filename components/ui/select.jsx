"use client";

import * as RSelect from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "./utils";

export const Select = ({
                           value,
                           onValueChange,
                           options, // [{ value, label }]
                           placeholder = "선택하세요",
                           error,
                           disabled,
                           className,
                       }) => {
    return (
        <RSelect.Root
            value={value ?? ""}
            onValueChange={onValueChange}
            disabled={disabled}
        >
            <RSelect.Trigger
                aria-invalid={!!error}
                className={cn(
                    "h-12 w-full rounded-md border bg-white px-3 text-sm",
                    "flex items-center justify-between",
                    "focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 data-[placeholder]:text-slate-400",
                    error && "border-red-400 focus:border-red-400 focus:ring-red-500/20",
                    className
                )}
            >
                <RSelect.Value placeholder={placeholder} />
                <RSelect.Icon>
                    <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </RSelect.Icon>
            </RSelect.Trigger>

            <RSelect.Portal>
                <RSelect.Content
                    position="popper"
                    className="z-50 mt-1 overflow-hidden rounded-md border bg-white shadow-md"
                >
                    <RSelect.Viewport className="p-1">
                        {options?.map((opt) => (
                            <RSelect.Item
                                key={opt.value ? opt.value : opt}
                                value={opt.value ? opt.value : opt}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-md py-2 pl-3 pr-8 text-sm outline-none",
                                    "hover:bg-slate-50 hover:cursor-pointer focus:bg-slate-100 data-[disabled]:opacity-50",
                                    "w-[var(--radix-select-trigger-width)]"
                                )}
                            >
                                <RSelect.ItemText>
                                    {opt.label ? opt.label : opt}
                                </RSelect.ItemText>
                                <span className="absolute right-2">
                  <RSelect.ItemIndicator>
                    <CheckIcon className="h-4 w-4" />
                  </RSelect.ItemIndicator>
                </span>
                            </RSelect.Item>
                        ))}
                    </RSelect.Viewport>
                </RSelect.Content>
            </RSelect.Portal>
        </RSelect.Root>
    );
};