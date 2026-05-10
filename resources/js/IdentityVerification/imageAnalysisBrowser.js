import { analyzeImageData } from './imageAnalysisCore';

export const loadCanvas = (file, maxSide = 900) => new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
        URL.revokeObjectURL(url);

        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);

        resolve({
            canvas,
            context,
            width: sourceWidth,
            height: sourceHeight,
            sampleWidth: width,
            sampleHeight: height,
        });
    };

    image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('The selected image cannot be opened by the browser.'));
    };

    image.src = url;
});

export const analyzeImageQualityMain = async (file, role, captureMetadata = null) => {
    const loaded = await loadCanvas(file);
    const { context, sampleWidth, sampleHeight, width, height } = loaded;
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    const analysis = analyzeImageData({
        data,
        sampleWidth,
        sampleHeight,
        width,
        height,
        fileSize: file.size,
        role,
        captureMetadata,
    });

    return {
        ...loaded,
        ...analysis,
    };
};
