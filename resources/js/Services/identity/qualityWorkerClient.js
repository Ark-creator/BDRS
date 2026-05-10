import { clamp } from './textUtils';

const DEFAULT_MAX_SIDE = 900;

let workerInstance = null;
let requestId = 0;
const pending = new Map();

const getWorker = () => {
    if (!workerInstance) {
        workerInstance = new Worker(new URL('../../Workers/identityQuality.worker.js', import.meta.url), {
            type: 'module',
        });

        workerInstance.onmessage = (event) => {
            const { id, payload, error } = event.data || {};
            const callback = pending.get(id);
            if (!callback) return;
            pending.delete(id);
            if (error) {
                callback.reject(new Error(error));
            } else {
                callback.resolve(payload);
            }
        };

        workerInstance.onerror = (error) => {
            pending.forEach((callback) => callback.reject(error));
            pending.clear();
        };
    }

    return workerInstance;
};

export const loadCanvas = (file, maxSide = DEFAULT_MAX_SIDE) => new Promise((resolve, reject) => {
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

export const analyzeImageQuality = async ({ file, role, signal, maxSide }) => {
    const loaded = await loadCanvas(file, maxSide);
    if (signal?.aborted) {
        throw new DOMException('Validation was cancelled.', 'AbortError');
    }

    const { context, sampleWidth, sampleHeight } = loaded;
    const imageData = context.getImageData(0, 0, sampleWidth, sampleHeight);
    const id = ++requestId;

    const worker = getWorker();

    const payload = await new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({
            id,
            role,
            width: sampleWidth,
            height: sampleHeight,
            fullWidth: loaded.width,
            fullHeight: loaded.height,
            data: imageData.data.buffer,
        }, [imageData.data.buffer]);
    });

    const qualityScore = clamp(payload?.quality?.score ?? 0, 0, 100);

    return {
        ...loaded,
        quality: {
            ...payload.quality,
            score: qualityScore,
        },
        geometry: payload.geometry,
    };
};
