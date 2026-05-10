import React, { useEffect, useRef, useState } from 'react';
import CameraOverlay from './CameraOverlay';
import { getVideoInfo, requestCameraStream, stopCameraStream } from '@/Services/cameraStream';

const CameraIcon = () => (
    <svg className="h-5 w-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CameraModal = ({
    isOpen,
    onClose,
    onCapture,
    facingMode,
    title,
    captureTarget,
    idealVideoWidth = 1280,
    idealVideoHeight = 720,
    maxCaptureWidth = 1000,
    maxCaptureHeight = 1000,
}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [videoInfo, setVideoInfo] = useState(null);

    const stopCamera = () => {
        stopCameraStream(stream);
        setStream(null);
    };

    const refreshVideoInfo = () => {
        setVideoInfo(getVideoInfo(videoRef.current, stream, facingMode));
    };

    useEffect(() => {
        if (isOpen) {
            setError(null);
            requestCameraStream({
                facingMode,
                idealWidth: idealVideoWidth,
                idealHeight: idealVideoHeight,
            })
                .then((mediaStream) => {
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                })
                .catch((err) => {
                    console.error('Camera Error:', err);
                    setError(`Could not access the camera. Please ensure you have granted permission in your browser. Error: ${err.name}`);
                    stopCamera();
                });
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen, facingMode, idealVideoWidth, idealVideoHeight]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (facingMode === 'user') {
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

            const maxWidth = maxCaptureWidth;
            const maxHeight = maxCaptureHeight;
            let newWidth = canvas.width;
            let newHeight = canvas.height;

            if (newWidth > maxWidth || newHeight > maxHeight) {
                const ratio = Math.min(maxWidth / newWidth, maxHeight / newHeight);
                newWidth *= ratio;
                newHeight *= ratio;
            }

            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = newWidth;
            resizedCanvas.height = newHeight;
            const resizedContext = resizedCanvas.getContext('2d');
            resizedContext.imageSmoothingEnabled = true;
            resizedContext.imageSmoothingQuality = 'high';
            resizedContext.drawImage(canvas, 0, 0, newWidth, newHeight);

            resizedCanvas.toBlob((blob) => {
                if (!blob) return;
                const file = new File([blob], `${title.replace(/\s/g, '_')}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose();
            }, 'image/jpeg', 0.92);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                        {videoInfo && (
                            <p className="text-xs text-slate-500">Camera: {videoInfo.width || '?'}x{videoInfo.height || '?'}</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-4 flex-grow relative overflow-hidden">
                    {error ? (
                        <div className="w-full h-full flex items-center justify-center text-center text-red-600 bg-red-50 rounded-md p-4">{error}</div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            onLoadedMetadata={refreshVideoInfo}
                            onPlaying={refreshVideoInfo}
                            className={`w-full h-full object-contain rounded-md ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        ></video>
                    )}
                    {!error && <CameraOverlay target={captureTarget} />}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                <div className="p-4 border-t bg-slate-50 flex gap-4">
                    <button type="button" onClick={onClose} className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-200 transition">
                        Cancel
                    </button>
                    <button type="button" onClick={handleCapture} disabled={!stream || !!error} className="w-full group flex justify-center items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-semibold text-white shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50">
                        <CameraIcon /> Capture Photo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
