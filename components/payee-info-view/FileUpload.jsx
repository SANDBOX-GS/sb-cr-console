import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadIcon } from "lucide-react";
import React, { useState } from "react";

/**
 * @typedef {object} FileUploadProps
 * @property {File | FileInfo | undefined | null} [file] 현재 파일 객체 또는 파일 정보입니다.
 * @property {(file: File | undefined) => void} onChange 파일 변경 핸들러입니다.
 * @property {string} label 필드 레이블입니다.
 * @property {string} [accept] 허용되는 파일 확장자 (예: ".pdf,.jpg").
 * @property {boolean} [required=false] 필수 입력 여부입니다.
 */

/**
 * 파일을 업로드하거나 기존 파일을 표시할 수 있는 UI 컴포넌트입니다.
 * @param {FileUploadProps} props
 */
export function FileUpload({
                               file,
                               onChange,
                               label,
                               accept,
                               required = false,
                           }) {
    // 💡 드래그 상태 관리
    const [isDragging, setIsDragging] = useState(false);

    // 파일 입력 요소와 레이블을 연결하기 위한 고유 ID를 생성합니다.
    const fileInputId = `file-${label.replace(/\s+/g, '-')}`;

    // 🌟 파일 삭제 핸들러 (FileInfo이든 File이든 모두 제거) 🌟
    const handleRemoveFile = () => {
        onChange(undefined);
    };

    /**
     * @param {FileList} fileList
     */
    const handleFileDrop = (fileList) => {
        const droppedFile = fileList?.[0];

        if (droppedFile) {
            // 허용되는 확장자 체크 (간단한 클라이언트 측 검증)
            const allowedExtensions = accept ? accept.split(',').map(ext => ext.trim()) : [];
            const fileExtension = droppedFile.name.split('.').pop();
            const isValid = allowedExtensions.length === 0 || allowedExtensions.includes(`.${fileExtension}`);

            if (isValid) {
                onChange(droppedFile);
            } else {
                // 토스트 알림 등을 통해 사용자에게 알려줄 수 있습니다. (토스트 라이브러리 가정)
                // toast.error(`지원하지 않는 파일 형식입니다. (${accept})`);
            }
        }
    };

    // ----------------------------------------------------
    // 드래그 앤 드롭 이벤트 핸들러
    // ----------------------------------------------------
    const handleDragOver = (e) => {
        e.preventDefault(); // 드롭 허용
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 💡 드래그 중인 파일이 있을 때만 isDragging 상태 변경
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileDrop(e.dataTransfer.files);
        }
    };

    // ----------------------------------------------------
    // 렌더링 로직
    // ----------------------------------------------------
    return (
        <div className="space-y-2">
            <Label className="text-slate-600">
                {label}{" "}
                {required && <span className="text-red-500">*</span>}
            </Label>

            {/* 💡 드래그 앤 드롭 이벤트 리스너 추가 및 드래그 시 스타일 변경 */}
            <div
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors 
                            ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-slate-400'}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <UploadIcon className="w-6 h-6 text-slate-400 mx-auto mb-2" />

                {/* 실제 파일 입력 필드 (숨겨짐) */}
                <input
                    type="file"
                    accept={accept}
                    onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        onChange(selectedFile);
                        e.target.value = ''; // 동일 파일 재선택을 위해 초기화
                    }}
                    className="hidden"
                    id={fileInputId}
                />

                {/* 레이블 역할: 클릭 가능 영역 (전체 박스를 클릭해도 파일 선택) */}
                <label
                    htmlFor={fileInputId}
                    className="cursor-pointer block" // block으로 설정하여 영역 전체를 클릭 가능하게
                >
                    <p className={`text-xs ${file ? 'text-slate-700 font-medium' : 'text-slate-600'} mb-1`}>
                        {/* 💡 파일이 있으면 파일 이름, 없으면 메시지 표시 */}
                        {file
                            ? file.name
                            : "파일을 선택하거나 여기에 끌어다 놓으세요"}
                    </p>
                    <p className="text-xs text-slate-500">
                        {/* 💡 기획에 있던 고정 텍스트를 사용 (accept prop 대신) */}
                        PDF, JPG, PNG 파일 (최대 10MB)
                    </p>
                </label>

                {/* 🌟 파일이 있을 때만 삭제 버튼 표시 🌟 */}
                {file && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="mt-2" // 기획 디자인에 따라 마진 추가
                    >
                        파일 삭제
                    </Button>
                )}
            </div>
        </div>
    );
}