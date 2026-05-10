import { analyzeImageData } from './imageAnalysisCore';

const analyze = async ({ file, role, captureMetadata }) => {
    if (typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined') {
        throw new Error('Worker image analysis is not supported by this browser.');
    }

    const bitmap = await createImageBitmap(file);
    try {
        const sourceWidth = bitmap.width;
        const sourceHeight = bitmap.height;
        const scale = Math.min(1, 900 / Math.max(sourceWidth, sourceHeight));
        const sampleWidth = Math.max(1, Math.round(sourceWidth * scale));
        const sampleHeight = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = new OffscreenCanvas(sampleWidth, sampleHeight);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight);
        const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);

        return analyzeImageData({
            data,
            sampleWidth,
            sampleHeight,
            width: sourceWidth,
            height: sourceHeight,
            fileSize: file.size,
            role,
            captureMetadata,
        });
    } finally {
        bitmap.close?.();
    }
};

self.onmessage = async (event) => {
    const { id, payload } = event.data || {};

    try {
        const result = await analyze(payload);
        self.postMessage({ id, ok: true, result });
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: error?.message || 'Image analysis failed.',
        });
    }
};
