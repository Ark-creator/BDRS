import { analyzeImageQualityMain } from './imageAnalysisBrowser';

let worker = null;
let nextRequestId = 1;
const pendingRequests = new Map();

const canUseWorker = () => typeof Worker !== 'undefined' && typeof URL !== 'undefined';

const getWorker = () => {
    if (!canUseWorker()) return null;
    if (worker) return worker;

    try {
        worker = new Worker(new URL('./identityValidationWorker.js', import.meta.url), { type: 'module' });
        worker.onmessage = (event) => {
            const { id, ok, result, error } = event.data || {};
            const pending = pendingRequests.get(id);
            if (!pending) return;

            pendingRequests.delete(id);
            if (ok) {
                pending.resolve(result);
            } else {
                pending.reject(new Error(error || 'Image analysis failed.'));
            }
        };
        worker.onerror = (event) => {
            const error = new Error(event.message || 'Image analysis worker failed.');
            for (const [id, pending] of pendingRequests) {
                pending.reject(error);
                pendingRequests.delete(id);
            }
            worker?.terminate();
            worker = null;
        };
    } catch {
        worker = null;
    }

    return worker;
};

const abortError = () => {
    try {
        return new DOMException('Validation was cancelled.', 'AbortError');
    } catch {
        const error = new Error('Validation was cancelled.');
        error.name = 'AbortError';
        return error;
    }
};

export const analyzeImageQuality = async (file, role, signal) => {
    const captureMetadata = file?.captureMetadata || null;
    const activeWorker = getWorker();

    if (signal?.aborted) {
        throw abortError();
    }

    if (!activeWorker) {
        return analyzeImageQualityMain(file, role, captureMetadata);
    }

    return new Promise((resolve, reject) => {
        const id = nextRequestId;
        nextRequestId += 1;

        const cleanupAbort = () => {
            pendingRequests.delete(id);
            reject(abortError());
        };

        if (signal) {
            signal.addEventListener('abort', cleanupAbort, { once: true });
        }

        pendingRequests.set(id, {
            resolve: (result) => {
                signal?.removeEventListener('abort', cleanupAbort);
                resolve(result);
            },
            reject: async (error) => {
                signal?.removeEventListener('abort', cleanupAbort);
                pendingRequests.delete(id);
                try {
                    resolve(await analyzeImageQualityMain(file, role, captureMetadata));
                } catch {
                    reject(error);
                }
            },
        });

        activeWorker.postMessage({
            id,
            payload: {
                file,
                role,
                captureMetadata,
            },
        });
    });
};

export const getValidationWorkerStatus = () => ({
    available: Boolean(getWorker()),
    pending: pendingRequests.size,
});
