"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  File as FileIcon,
} from "lucide-react";
import { Button } from "./button";

/**
 * File preview modal (supports both File and external URL)
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {File=} props.file
 * @param {string=} props.fileUrl   // external url (e.g., s3 url)
 * @param {string=} props.fileName  // optional display name for external url
 */
export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  fileUrl: externalUrl,
  fileName,
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [objectUrl, setObjectUrl] = useState(null);

  const hasFile = !!file;
  const hasExternal = !!externalUrl;

  // Build preview src
  const src = useMemo(() => {
    return hasFile ? objectUrl : externalUrl;
  }, [hasFile, objectUrl, externalUrl]);

  // Type detection
  const isImage = useMemo(() => {
    if (hasFile) return file?.type?.startsWith("image/");
    if (hasExternal) return /\.(png|jpg|jpeg|webp)$/i.test(externalUrl);
    return false;
  }, [hasFile, file, hasExternal, externalUrl]);

  const isPdf = useMemo(() => {
    if (hasFile) return file?.type === "application/pdf";
    if (hasExternal) return /\.pdf$/i.test(externalUrl);
    return false;
  }, [hasFile, file, hasExternal, externalUrl]);

  const displayName = useMemo(() => {
    return (
      file?.name ??
      fileName ??
      (hasExternal ? "업로드된 파일" : "파일 미리보기")
    );
  }, [file, fileName, hasExternal]);

  // Create/revoke object URL for File
  useEffect(() => {
    if (!hasFile || !isOpen) {
      setObjectUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [hasFile, file, isOpen]);

  const handleClose = () => {
    setScale(1);
    setRotation(0);
    onClose();
  };

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // If nothing to show, render nothing
  if (!hasFile && !hasExternal) return null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Floating Controls (Top Right) */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-4 z-20 flex items-center gap-1 rounded-full bg-black/30 backdrop-blur-lg p-1.5 border border-white/20"
          >
            {isImage ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hover:text-white rounded-full"
                  onClick={() => setScale((s) => s * 1.2)}
                >
                  <ZoomIn className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hover:text-white rounded-full"
                  onClick={() => setScale((s) => s / 1.2)}
                >
                  <ZoomOut className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hover:text-white rounded-full"
                  onClick={() => setRotation((r) => r + 90)}
                >
                  <RotateCw className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hover:text-white rounded-full"
                  onClick={() => {
                    setScale(1);
                    setRotation(0);
                  }}
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
                <div className="w-px h-6 bg-white/20 mx-1" />
              </>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 hover:text-white rounded-full"
              onClick={handleClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </motion.div>

          {/* File Name (Top Left) */}
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-4 left-4 z-20 rounded-full bg-black/30 backdrop-blur-lg py-2 px-4 text-white text-sm"
          >
            {displayName}
          </motion.p>

          {/* Content Area */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-full max-h-[85vh] flex items-center justify-center"
          >
            {isImage && src ? (
              <motion.img
                src={src}
                alt="File preview"
                className="max-w-full max-h-full object-contain cursor-grab rounded-lg shadow-2xl"
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragMomentum={false}
                animate={{ scale, rotate: rotation }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            ) : null}

            {isPdf && src ? (
              <iframe
                src={src}
                title={displayName}
                className="w-full h-full border-none rounded-lg bg-white"
              />
            ) : null}

            {!isImage && !isPdf ? (
              <div className="flex flex-col items-center justify-center text-white bg-slate-800/50 p-8 rounded-lg">
                <FileIcon className="w-16 h-16 mb-4 text-slate-400" />
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-slate-300 mt-2">
                  이 파일 형식은 미리보기를 지원하지 않습니다.
                </p>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
