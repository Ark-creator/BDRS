const WASM_BASE = '/vendor/bdrs-wasm';
const WASM_EXEC_URL = `${WASM_BASE}/wasm_exec.js`;
const WASM_MODULE_URL = `${WASM_BASE}/bdrs-validator.wasm`;
const MANIFEST_URL = `${WASM_BASE}/wasm-manifest.json`;

let loadPromise = null;
let manifestCache = null;

const loadScript = (url) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
});

const waitForReady = (timeout = 15000) => new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
        if (window.__bdrsWasmReady === true && window.__bdrsWasm) {
            resolve(window.__bdrsWasm);
            return;
        }
        if (Date.now() - start > timeout) {
            reject(new Error('Go WASM initialization timed out.'));
            return;
        }
        requestAnimationFrame(check);
    };
    check();
});

export const loadBdrsWasm = async () => {
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = (async () => {
        try {
            await loadScript(WASM_EXEC_URL);

            const go = new globalThis.Go();
            const response = await fetch(WASM_MODULE_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch WASM module: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            const result = await WebAssembly.instantiate(buffer, go.importObject);
            go.run(result.instance);

            const api = await waitForReady();
            return api;
        } catch (error) {
            loadPromise = null;
            throw error;
        }
    })();

    return loadPromise;
};

export const fetchManifest = async () => {
    if (manifestCache) {
        return manifestCache;
    }

    try {
        const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
        if (!response.ok) {
            return null;
        }
        manifestCache = await response.json();
        return manifestCache;
    } catch {
        return null;
    }
};

export const getWasmVersion = async () => {
    try {
        const api = await loadBdrsWasm();
        return api.getVersion();
    } catch {
        return null;
    }
};

export const isWasmAvailable = async () => {
    try {
        const api = await loadBdrsWasm();
        return api && typeof api.analyzeImageQuality === 'function';
    } catch {
        return false;
    }
};

export const analyzeImageQualityGo = async (rgbaData, width, height) => {
    const api = await loadBdrsWasm();
    return api.analyzeImageQuality(rgbaData, width, height);
};

export const analyzeDocumentGeometryGo = async (rgbaData, width, height) => {
    const api = await loadBdrsWasm();
    return api.analyzeDocumentGeometry(rgbaData, width, height);
};

export const detectFacesGo = async (rgbaData, width, height, role) => {
    const api = await loadBdrsWasm();
    return api.detectFaces(rgbaData, width, height, role || 'selfie');
};

export const validateDocumentGo = async (rawText, documentType, documentSide, hasOcrEngine) => {
    const api = await loadBdrsWasm();
    return api.validateDocument(rawText, documentType, documentSide || 'front', hasOcrEngine !== false);
};

export const detectDocumentTypeGo = async (rawText) => {
    const api = await loadBdrsWasm();
    return api.detectDocumentType(rawText);
};

export const extractFieldsGo = async (rawText, selectedType) => {
    const api = await loadBdrsWasm();
    return api.extractFields(rawText, selectedType);
};

export const scoreDocumentTypeGo = async (rawText, documentType) => {
    const api = await loadBdrsWasm();
    return api.scoreDocumentType(rawText, documentType);
};

export const checkLivenessGo = async (qualityMetrics) => {
    const api = await loadBdrsWasm();
    return api.checkLiveness(qualityMetrics);
};

export const analyzeFraudGo = async (idMetrics, selfieMetrics, idHash, selfieHash) => {
    const api = await loadBdrsWasm();
    return api.analyzeFraud(idMetrics, selfieMetrics, idHash || '', selfieHash || '');
};

export const validateSelfieGo = async (rgbaData, width, height) => {
    const api = await loadBdrsWasm();
    return api.validateSelfie(rgbaData, width, height);
};

export const qualityIssuesGo = async (qualityMetrics, prefix) => {
    const api = await loadBdrsWasm();
    return api.qualityIssues(qualityMetrics, prefix);
};

export const browserQualityChecksGo = async (qualityMetrics, role) => {
    const api = await loadBdrsWasm();
    return api.browserQualityChecks(qualityMetrics, role);
};

export const estimateBarcodeSignalGo = async (rgbaData, width, height) => {
    const api = await loadBdrsWasm();
    return api.estimateBarcodeSignal(rgbaData, width, height);
};

export const collectBackIDEvidenceGo = async (rawText, qualityMetrics, barcodeLike, expectedScore) => {
    const api = await loadBdrsWasm();
    return api.collectBackIDEvidence(rawText, qualityMetrics, Boolean(barcodeLike), expectedScore);
};

export const getGoWasmHealth = async () => {
    const manifest = await fetchManifest();
    const checks = [WASM_EXEC_URL, WASM_MODULE_URL, MANIFEST_URL];

    const results = await Promise.all(checks.map(async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            return { url, ok: response.ok, status: response.status };
        } catch (error) {
            return { url, ok: false, error: error.message };
        }
    }));

    const missing = results.filter((check) => !check.ok);

    if (missing.length > 0) {
        return {
            status: 'unavailable',
            message: 'Go WASM validator assets are missing.',
            version: manifest?.version || null,
            missing_assets: missing,
        };
    }

    return {
        status: 'ok',
        message: 'Go WASM validator is ready.',
        version: manifest?.version || null,
        manifest,
        assets: results,
    };
};
