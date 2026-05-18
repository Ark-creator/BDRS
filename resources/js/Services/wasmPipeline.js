/**
 * BDRS WASM Pipeline — Unified orchestrator for Go WASM (quality/geometry)
 * and Python WASM (OCR, face, liveness, fraud) validation pipeline.
 *
 * Pipeline steps:
 *   1. Go WASM: analyzeImageQuality (id + selfie)
 *   2. Go WASM: detectFaces (selfie)
 *   3. Python WASM: extractOcr (id)
 *   4. Python WASM: compareFaces (id + selfie)
 *   5. Python WASM: checkLiveness (selfie)
 *   6. Python WASM: analyzeFraud (id + selfie)
 */

import {
    loadBdrsWasm,
    analyzeImageQualityGo,
    analyzeDocumentGeometryGo,
    detectFacesGo,
} from './wasmLoader';

const PYTHON_WASM_BASE = '/vendor/bdrs-wasm/pyodide';
const PROGRESS_EVENT = 'wasm-pipeline-progress';
const STEP_NAMES = [
    'quality',
    'face_detection',
    'ocr',
    'face_compare',
    'liveness',
    'fraud',
];

let goWasmApi = null;
let pyodideModules = {};
let sabBuffer = null;

const dispatchProgress = (step, status, detail = {}) => {
    const event = new CustomEvent(PROGRESS_EVENT, {
        detail: { step, status, ...detail },
    });
    window.dispatchEvent(event);
};

const loadGoWasm = async () => {
    if (goWasmApi) return goWasmApi;
    dispatchProgress('wasm', 'loading');
    try {
        goWasmApi = await loadBdrsWasm();
        dispatchProgress('wasm', 'loaded');
        return goWasmApi;
    } catch (error) {
        dispatchProgress('wasm', 'error', { error: error.message });
        throw error;
    }
};

const loadPythonWasm = async (moduleName) => {
    if (pyodideModules[moduleName]) return pyodideModules[moduleName];
    dispatchProgress(moduleName, 'loading');

    try {
        const moduleUrl = `${PYTHON_WASM_BASE}/${moduleName}/loader.mjs`;
        const mod = await import(moduleUrl);
        await mod.load();
        pyodideModules[moduleName] = mod;
        dispatchProgress(moduleName, 'loaded');
        return mod;
    } catch (error) {
        dispatchProgress(moduleName, 'error', { error: error.message });
        throw error;
    }
};

const withStep = (stepIndex, stepName, fn) => async (...args) => {
    dispatchProgress(stepName, 'running', { stepIndex });
    try {
        const result = await fn(...args);
        dispatchProgress(stepName, 'done', { stepIndex, result });
        return result;
    } catch (error) {
        dispatchProgress(stepName, 'error', { stepIndex, error: error.message });
        throw error;
    }
};

const getImageData = (imageFile) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            resolve({
                rgba: imageData.data.buffer,
                width: canvas.width,
                height: canvas.height,
                dataUrl: canvas.toDataURL('image/jpeg', 0.85),
            });
        };
        img.onerror = () => reject(new Error('Failed to decode image'));
        img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
});

const initSharedBuffer = (idData, selfieData) => {
    const idBytes = idData.rgba.byteLength;
    const selfieBytes = selfieData.rgba.byteLength;
    const totalSize = idBytes + selfieBytes + 4096;
    try {
        sabBuffer = new SharedArrayBuffer(totalSize);
    } catch {
        sabBuffer = null;
    }
    return sabBuffer;
};

const runPipeline = async (idImageFile, selfieImageFile, documentType) => {
    dispatchProgress('pipeline', 'starting');

    const idData = await getImageData(idImageFile);
    const selfieData = await getImageData(selfieImageFile);

    await loadGoWasm();
    initSharedBuffer(idData, selfieData);

    const pipelineResult = {
        status: 'queued',
        document_type: documentType,
        scores: {},
        extracted_data: null,
        document_validation: null,
        failure_reason: null,
        steps: [],
    };

    // Step 1: Image Quality Analysis
    const qualityStep = withStep(1, 'quality', async () => {
        const runOnImage = (rgba, width, height) =>
            analyzeImageQualityGo(new Uint8Array(rgba), width, height);

        const idQuality = await runOnImage(new Uint8Array(idData.rgba), idData.width, idData.height);
        const selfieQuality = await runOnImage(new Uint8Array(selfieData.rgba), selfieData.width, selfieData.height);

        return { id_quality: idQuality, selfie_quality: selfieQuality };
    });

    const quality = await qualityStep();
    pipelineResult.steps.push({ name: 'quality', status: 'done' });

    if (quality.id_quality.is_blurry || quality.selfie_quality.is_blurry) {
        pipelineResult.status = 'failed';
        pipelineResult.failure_reason = 'One or more images are too blurry.';
        dispatchProgress('pipeline', 'completed', { result: pipelineResult });
        return pipelineResult;
    }

    // Step 2: Face Detection
    const faceStep = withStep(2, 'face_detection', async () => {
        const faces = await detectFacesGo(
            new Uint8Array(selfieData.rgba),
            selfieData.width,
            selfieData.height,
            'selfie',
        );
        return faces;
    });

    const faces = await faceStep();
    pipelineResult.steps.push({ name: 'face_detection', status: 'done' });
    pipelineResult.face_count = faces?.length || 0;

    if (!faces || faces.length === 0) {
        pipelineResult.status = 'failed';
        pipelineResult.failure_reason = 'No face detected in selfie.';
        dispatchProgress('pipeline', 'completed', { result: pipelineResult });
        return pipelineResult;
    }

    // Step 3: OCR via Python WASM
    const ocrStep = withStep(3, 'ocr', async () => {
        const ocrMod = await loadPythonWasm('ocr');
        const idBlob = await (await fetch(idData.dataUrl)).blob();
        const idBytes = await idBlob.arrayBuffer();
        return ocrMod.extractOcr(new Uint8Array(idBytes), documentType);
    });

    let ocrResult;
    try {
        ocrResult = await ocrStep();
        if (ocrResult.status === 'failed') {
            ocrResult = {
                status: 'completed',
                confidence: 0,
                fields: {},
                document_validation: {},
                raw_text: [],
                issues: ['id_ocr_engine_unavailable'],
                engine: 'pyodide-unavailable',
            };
        }
    } catch {
        ocrResult = {
            status: 'completed',
            confidence: 0,
            fields: {},
            document_validation: {},
            raw_text: [],
            issues: ['id_ocr_engine_unavailable'],
            engine: 'pyodide-unavailable',
        };
    }
    pipelineResult.steps.push({ name: 'ocr', status: 'done' });
    pipelineResult.extracted_data = ocrResult.fields || ocrResult;
    pipelineResult.document_validation = ocrResult.document_validation || null;
    pipelineResult.ocr_confidence = ocrResult.confidence || 0;

    // Step 4: Face Comparison via Python WASM
    const faceCompareStep = withStep(4, 'face_compare', async () => {
        const faceMod = await loadPythonWasm('face');
        const idBlob = await (await fetch(idData.dataUrl)).blob();
        const selfieBlob = await (await fetch(selfieData.dataUrl)).blob();
        return faceMod.compareFaces(
            new Uint8Array(await idBlob.arrayBuffer()),
            new Uint8Array(await selfieBlob.arrayBuffer()),
        );
    });

    let faceResult;
    try {
        faceResult = await faceCompareStep();
    } catch {
        faceResult = { status: 'failed', similarity: 0, matched: false, checks: {} };
    }
    pipelineResult.steps.push({ name: 'face_compare', status: 'done' });
    pipelineResult.face_match_score = faceResult.similarity || 0;

    // Step 5: Liveness Detection via Python WASM
    const livenessStep = withStep(5, 'liveness', async () => {
        const livenessMod = await loadPythonWasm('liveness');
        const selfieBlob = await (await fetch(selfieData.dataUrl)).blob();
        return livenessMod.checkLiveness(new Uint8Array(await selfieBlob.arrayBuffer()));
    });

    let livenessResult;
    try {
        livenessResult = await livenessStep();
    } catch {
        livenessResult = { status: 'failed', score: 0, passed: false };
    }
    pipelineResult.steps.push({ name: 'liveness', status: 'done' });
    pipelineResult.liveness_score = livenessResult.score || 0;

    // Step 6: Fraud Analysis via Python WASM
    const fraudStep = withStep(6, 'fraud', async () => {
        const fraudMod = await loadPythonWasm('fraud');
        const idBlob = await (await fetch(idData.dataUrl)).blob();
        const selfieBlob = await (await fetch(selfieData.dataUrl)).blob();
        return fraudMod.analyzeFraud(
            new Uint8Array(await idBlob.arrayBuffer()),
            new Uint8Array(await selfieBlob.arrayBuffer()),
        );
    });

    let fraudResult;
    try {
        fraudResult = await fraudStep();
    } catch {
        fraudResult = { status: 'failed', fake_probability: 50, issues: [] };
    }
    pipelineResult.steps.push({ name: 'fraud', status: 'done' });
    pipelineResult.fake_probability = fraudResult.fake_probability || 0;

    // Compute overall score
    const face = pipelineResult.face_match_score || 0;
    const ocr = pipelineResult.ocr_confidence || 0;
    const liveness = pipelineResult.liveness_score || 0;
    const fakeProb = pipelineResult.fake_probability || 50;
    const overall = Math.round(
        (face * 0.35) + (ocr * 0.20) + (liveness * 0.25) + ((100 - fakeProb) * 0.20),
        2,
    );

    pipelineResult.scores = {
        face_match: face,
        ocr_confidence: ocr,
        liveness_score: liveness,
        fake_probability: fakeProb,
        overall_score: overall,
    };

    // Determine final status (mirrors VerificationScoreService logic)
    const facePass = face >= 82;
    const ocrPass = ocr >= 70;
    const livenessPass = liveness >= 75;
    const fakePass = fakeProb <= 25;

    if (facePass && ocrPass && livenessPass && fakePass && overall >= 85) {
        pipelineResult.status = 'approved';
    } else if (overall >= 60) {
        pipelineResult.status = 'review_required';
    } else {
        pipelineResult.status = 'rejected';
    }

    pipelineResult.overall_score = overall;
    dispatchProgress('pipeline', 'completed', { result: pipelineResult });
    return pipelineResult;
};

const isReady = () => goWasmApi !== null;

export {
    loadGoWasm,
    loadPythonWasm,
    runPipeline,
    isReady,
    PROGRESS_EVENT,
    STEP_NAMES,
};
