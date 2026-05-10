import { createWorker } from 'tesseract.js';

import { getTesseractBase } from './wasmConfig';

let ocrWorkerPromise = null;

export const getOcrWorker = async () => {
    if (!ocrWorkerPromise) {
        const base = getTesseractBase();
        ocrWorkerPromise = createWorker('eng', 1, {
            workerPath: `${base}/worker.min.js`,
            corePath: `${base}/core/tesseract-core.wasm.js`,
            langPath: `${base}/lang`,
            gzip: true,
            logger: () => {},
        }).then(async (worker) => {
            await worker.setParameters({
                preserve_interword_spaces: '1',
                tessedit_pageseg_mode: '6',
            });

            return worker;
        }).catch((error) => {
            ocrWorkerPromise = null;
            throw error;
        });
    }

    return ocrWorkerPromise;
};

export const runOcr = async (file, signal) => {
    if (signal?.aborted) {
        throw new DOMException('Validation was cancelled.', 'AbortError');
    }

    const worker = await getOcrWorker();
    if (signal?.aborted) {
        throw new DOMException('Validation was cancelled.', 'AbortError');
    }

    const result = await worker.recognize(file);
    if (signal?.aborted) {
        throw new DOMException('Validation was cancelled.', 'AbortError');
    }

    const data = result?.data || {};
    return {
        ok: true,
        text: data.text || '',
        confidence: Math.round(data.confidence || 0),
        words: data.words || [],
    };
};
