import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileIcon, EyeIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";

// 🌟 FileInfo 타입 정의 (DB에서 가져온 URL 기반 파일 정보) 🌟
/**
 * @typedef {object} FileInfo
 * @property {string} url 파일 다운로드 URL (S3 URL 등)
 * @property {string} name 파일의 실제 이름 (예: '원본.jpg')
 */

/**
 * @typedef {object} FilePreviewProps
 * @property {File | undefined} [file] 현재 미리보기할 파일 객체입니다.
 * @property {string} label 파일 필드의 레이블입니다.
 */

/**
 * 업로드된 파일을 보여주고 미리보기할 수 있는 컴포넌트입니다.
 * @param {FilePreviewProps} props
 */
export function FilePreview({ file, label }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🌟 파일 속성 식별 🌟
    const isFileInfo = file && typeof file === 'object' && 'url' in file;
    const isFileObject = file && file instanceof File;

    // 파일 URL을 얻는 헬퍼 함수
    const getFileUrl = (file) => {
        if (isFileObject) {
            return URL.createObjectURL(file); // File 객체는 브라우저 URL 사용
        }
        if (isFileInfo) {
            return file.url; // FileInfo 객체는 DB에서 받은 S3 URL 사용
        }
        return null;
    };

    // 파일 타입/확장자 식별
    const getFileType = (file) => {
        if (isFileObject) {
            return file.type;
        }
        if (isFileInfo) {
            // URL에서 확장자를 추출하여 타입 추정 (간소화)
            const url = file.url.toLowerCase();
            if (url.endsWith('.pdf')) return 'application/pdf';
            if (url.endsWith('.jpg') || url.endsWith('.jpeg')) return 'image/jpeg';
            if (url.endsWith('.png')) return 'image/png';
        }
        return '';
    };

    const isImageFile = (file) => getFileType(file).startsWith('image/');
    const isPDFFile = (file) => getFileType(file) === 'application/pdf';

    // 🌟 URL을 기반으로 미리보기 콘텐츠를 생성하도록 수정 🌟
    const getFilePreviewContent = (file) => {
        const fileUrl = getFileUrl(file);
        if (!fileUrl) return null;

        if (isImageFile(file)) {
            return (
                <div className="flex justify-center">
                    <img
                        src={fileUrl}
                        alt={file.name}
                        // DB URL을 사용할 경우 CORS 문제 발생 가능성 있음 (별도 프록시 서버 필요할 수도 있음)
                        crossOrigin="anonymous"
                        className="max-w-full max-h-96 object-contain rounded-lg"
                    />
                </div>
            );
        } else if (isPDFFile(file)) {
            return (
                <div className="flex justify-center">
                    <iframe
                        // DB URL을 직접 iframe src로 사용합니다.
                        src={fileUrl}
                        className="w-full h-96 border rounded-lg"
                        title={file.name}
                    />
                </div>
            );
        } else {
            return (
                <div className="text-center p-8 text-slate-500">
                    <FileIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <p>이 파일 형식은 미리보기를 지원하지 않습니다.</p>
                    <p className="text-sm mt-2">{file.name}</p>
                </div>
            );
        }
    };

    // 파일 크기 가져오기 (FileInfo에는 size 정보가 없다고 가정하고 처리)
    const fileSizeText = isFileObject
        ? `(${(file.size / 1024 / 1024).toFixed(2)} MB)`
        : '';

    const currentFileName = file ? file.name : null;

    return (
        <div className="space-y-2">
            <Label className="text-slate-600">{label}</Label>
            {file ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border">
                    <FileIcon className="w-5 h-5 text-slate-500" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">
                            {currentFileName}
                        </p>
                        <p className="text-xs text-slate-500">
                            {fileSizeText}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* 미리보기 버튼 및 모달 */}
                        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-slate-600 hover:text-slate-800"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-left">
                                        {currentFileName} 미리보기
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="mt-4">
                                    {getFilePreviewContent(file)}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            ) : (
                <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center">
                    <p className="text-sm text-slate-500">
                        등록된 파일이 없습니다.
                    </p>
                </div>
            )}
        </div>
    );
}