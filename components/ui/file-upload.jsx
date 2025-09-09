"use client";

import React, { useState, useRef } from 'react';
import { UploadIcon, FileIcon, XIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import FilePreviewModal from './image-preview-modal';

/**
 * A reusable file upload component with drag-and-drop support.
 * @param {object} props - The component props.
 * @param {File} [props.file] - The currently selected file.
 * @param {(file: File | undefined) => void} props.onFileChange - Callback function when the file is changed or removed.
 * @param {string} props.label - The label for the upload area.
 * @param {string} [props.accept] - The accepted file types (e.g., "image/*,.pdf").
 */
export default function FileUpload({ file, onFileChange, label, accept }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef(null);
    const dragCounter = useRef(0);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFileChange(files[0]);
        }
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileChange(files[0]);
        }
    };

    const handleAreaClick = () => {
        if (file) return;
        fileInputRef.current?.click();
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        onFileChange(undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const isImage = file?.type.startsWith('image/');
    const isPdf = file?.type === 'application/pdf';
    const isPreviewable = isImage || isPdf;

    const handlePreviewClick = (e) => {
        e.stopPropagation();
        if (file && isPreviewable) {
            setIsModalOpen(true);
        }
    }

    return (
        <>
            <div className="space-y-2">
                <Label htmlFor={label}>{label}</Label>
                <div
                    onClick={handleAreaClick}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "relative overflow-hidden border-2 border-dashed border-slate-300 rounded-xl p-6 text-center transition-all duration-300 ease-in-out",
                        file ? "" : "cursor-pointer",
                        isDragging
                            ? "border-transparent bg-indigo-100/80 ring-4 ring-indigo-500/20"
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
                    />

                    <div className={cn("transition-opacity duration-200", isDragging && "opacity-20")}>
                        {file ? (
                            <div
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3",
                                    isPreviewable && "cursor-pointer" // 미리보기 가능할 때만 커서 변경
                                )}
                                onClick={handlePreviewClick}
                            >
                                {isImage ? (
                                    <ImageIcon className="w-10 h-10 text-indigo-500" />
                                ) : (
                                    <FileIcon className="w-10 h-10 text-slate-500" />
                                )}
                                <span className="text-sm font-medium text-slate-700">{file.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveFile}
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600 z-10"
                                >
                                    <XIcon className="w-4 h-4 mr-2" />
                                    파일 삭제
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                                <UploadIcon className="w-8 h-8" />
                                <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 업로드하세요</p>
                                <p className="text-xs">PDF, JPG, PNG 파일 (최대 10MB)</p>
                            </div>
                        )}
                    </div>

                    {isDragging && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-500/10 backdrop-blur-sm pointer-events-none">
                            <UploadIcon className="w-12 h-12 text-indigo-600 animate-bounce" />
                            <p className="mt-2 text-lg font-semibold text-indigo-700">여기에 파일을 놓으세요</p>
                        </div>
                    )}
                </div>
            </div>
            <FilePreviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                file={file}
            />
        </>
    );
}

