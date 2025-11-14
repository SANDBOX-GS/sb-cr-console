"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, File as FileIcon } from 'lucide-react';
import { Button } from './button';

/**
 * A modal for previewing image and PDF files.
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {() => void} props.onClose - Function to close the modal.
 * @param {File} [props.file] - The file to display.
 */
export default function FilePreviewModal({ isOpen, onClose, file }) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [fileUrl, setFileUrl] = useState(null);

    const isImage = file?.type.startsWith('image/');
    const isPdf = file?.type === 'application/pdf';

    // Create a URL for the file to be used in src attributes
    useEffect(() => {
        if (file && isOpen) {
            const url = URL.createObjectURL(file);
            setFileUrl(url);

            // Clean up the object URL when the component unmounts or the file changes
            return () => URL.revokeObjectURL(url);
        }
    }, [file, isOpen]);

    // Reset transformations when the modal is closed
    const handleClose = () => {
        setScale(1);
        setRotation(0);
        onClose();
    };

    // Add keyboard shortcut (Escape key) to close the modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (!file) return null;

    return (
        <AnimatePresence>
            {isOpen && (
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
                        {isImage && (
                            <>
                                <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full" onClick={() => setScale(s => s * 1.2)}>
                                    <ZoomIn className="w-5 h-5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full" onClick={() => setScale(s => s / 1.2)}>
                                    <ZoomOut className="w-5 h-5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full" onClick={() => setRotation(r => r + 90)}>
                                    <RotateCw className="w-5 h-5" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full" onClick={() => { setScale(1); setRotation(0); }}>
                                    <RefreshCw className="w-5 h-5" />
                                </Button>
                                <div className="w-px h-6 bg-white/20 mx-1"></div>
                            </>
                        )}
                        <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full" onClick={handleClose}>
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
                        {file.name}
                    </motion.p>

                    {/* Content Area */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-5xl h-full max-h-[85vh] flex items-center justify-center"
                    >
                        {isImage && (
                            <motion.img
                                src={fileUrl}
                                alt="File preview"
                                className="max-w-full max-h-full object-contain cursor-grab rounded-lg shadow-2xl"
                                drag
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragMomentum={false}
                                animate={{ scale, rotate: rotation }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                        {isPdf && (
                            <iframe
                                src={fileUrl}
                                title={file.name}
                                className="w-full h-full border-none rounded-lg bg-white"
                            />
                        )}
                        {!isImage && !isPdf && (
                            <div className="flex flex-col items-center justify-center text-white bg-slate-800/50 p-8 rounded-lg">
                                <FileIcon className="w-16 h-16 mb-4 text-slate-400" />
                                <p className="font-semibold">{file.name}</p>
                                <p className="text-sm text-slate-300 mt-2">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

