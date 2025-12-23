"use client";

import React, { useState, useRef } from "react";
import { UploadIcon, FileIcon, XIcon, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import FilePreviewModal from "./image-preview-modal";

/**
 * A reusable file upload component with drag-and-drop support.
 * @param {object} props - The component props.
 * @param {File} [props.file] - The currently selected file.
 * @param {(file: File | undefined) => void} props.onFileChange - Callback function when the file is changed or removed.
 * @param {string} props.label - The label for the upload area.
 * @param {string} [props.accept] - The accepted file types (e.g., "image/*,.pdf").
 */
// components/ui/file-upload.jsx (확장 버전)
export default function FileUpload({
  file, // File | undefined
  existingFile, // {url, name, ext} | null | undefined
  onFileChange, // (file?: File) => void
  onRemoveExisting, // () => void
  label,
  accept,
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const hasNewFile = !!file;
  const hasExisting = !!existingFile?.url;

  // ✅ 표시 대상 결정: new file 우선
  const displayName = hasNewFile
    ? file.name
    : hasExisting
    ? existingFile.name || "업로드된 파일"
    : null;

  // ✅ 미리보기 가능 여부 판단
  const isImage =
    (hasNewFile && file?.type?.startsWith("image/")) ||
    (!hasNewFile &&
      hasExisting &&
      /\.(png|jpg|jpeg|webp)$/i.test(existingFile.url));

  const isPdf =
    (hasNewFile && file?.type === "application/pdf") ||
    (!hasNewFile && hasExisting && /\.pdf$/i.test(existingFile.url));

  const isPreviewable = isImage || isPdf;

  const handleAreaClick = () => {
    if (disabled) return;
    // 기존 파일이 있어도 교체 업로드는 허용하는 정책이면 `if (file) return;`만 유지
    if (hasNewFile) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileChange(files[0]); // 새 파일 세팅
    }
  };

  const handleRemoveNewFile = (e) => {
    e.stopPropagation();
    onFileChange(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveExistingFile = (e) => {
    e.stopPropagation();
    onRemoveExisting?.(); // delete 플래그 세팅은 상위에서 처리
  };

  const handlePreviewClick = (e) => {
    e.stopPropagation();
    if (!isPreviewable) return;
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={label}>{label}</Label>

        <div
          onClick={handleAreaClick}
          // drag 로직 동일 (disabled면 early return 추가 가능)
          className={cn(
            "relative overflow-hidden border-2 border-dashed border-slate-300 rounded-xl p-6 text-center transition-all duration-300 ease-in-out",
            disabled
              ? "opacity-60 cursor-not-allowed"
              : hasNewFile
              ? ""
              : "cursor-pointer",
            isDragging
              ? "border-transparent bg-sky-100/80 ring-2 ring-sky-500/20"
              : "hover:border-slate-400 hover:bg-slate-50/50"
          )}
        >
          <input
            ref={fileInputRef}
            id={label}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled}
          />

          {displayName ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3",
                isPreviewable && "cursor-pointer"
              )}
              onClick={handlePreviewClick}
            >
              {isImage ? (
                <ImageIcon className="w-10 h-10 text-sky-500" />
              ) : (
                <FileIcon className="w-10 h-10 text-slate-500" />
              )}

              <span className="text-sm font-medium text-slate-700">
                {displayName}
              </span>

              <div className="flex gap-2">
                {/* 새 파일 삭제 */}
                {hasNewFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveNewFile}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 z-10"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    파일 삭제
                  </Button>
                )}

                {/* 기존 파일 삭제 */}
                {!hasNewFile && hasExisting && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveExistingFile}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 z-10"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    기존 파일 삭제
                  </Button>
                )}

                {/* 교체 업로드 버튼(정책 옵션) */}
                {!disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    파일 변경
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
              <UploadIcon className="w-8 h-8" />
              <p className="text-sm font-medium">
                파일을 드래그하거나 클릭하여 업로드하세요
              </p>
              <p className="text-xs">PDF, JPG, PNG 파일 (최대 10MB)</p>
            </div>
          )}
        </div>
      </div>

      {/* ✅ 모달은 "new file" 또는 "existing url" 둘 다 처리해야 함 */}
      <FilePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={file} // 새 업로드 File
        fileUrl={existingFile?.url} // 기존 S3 url
        fileName={existingFile?.name}
      />
    </>
  );
}
