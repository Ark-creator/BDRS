import { clamp } from './textUtils';

export const startCamera = async ({ facingMode, idealWidth, idealHeight }) => {
    return navigator.mediaDevices.getUserMedia({
        video: {
            facingMode,
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
        },
    });
};

export const stopCamera = (stream) => {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }
};

const captureSample = (video, size) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, size, size);
    return context.getImageData(0, 0, size, size).data;
};

export const sampleMotionScore = async (video, delayMs = 140) => {
    const sampleSize = 64;
    const first = captureSample(video, sampleSize);

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const second = captureSample(video, sampleSize);
    let totalDiff = 0;

    for (let i = 0; i < first.length; i += 4) {
        totalDiff += Math.abs(first[i] - second[i]);
        totalDiff += Math.abs(first[i + 1] - second[i + 1]);
        totalDiff += Math.abs(first[i + 2] - second[i + 2]);
    }

    const pixelCount = sampleSize * sampleSize * 3;
    const averageDiff = totalDiff / Math.max(1, pixelCount);

    return clamp((averageDiff / 255) * 100, 0, 100);
};

export const captureFrame = async ({ video, facingMode, maxWidth, maxHeight }) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (facingMode === 'user') {
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

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

    const motionScore = await sampleMotionScore(video);

    const blob = await new Promise((resolve) => resizedCanvas.toBlob(resolve, 'image/jpeg', 0.92));
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });

    return {
        file,
        motion_score: motionScore,
        width: newWidth,
        height: newHeight,
    };
};
