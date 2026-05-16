/**
 * WASM capability detection for BDRS identity verification.
 * Checks WebAssembly, SharedArrayBuffer, and runs a Go WASM probe.
 * Results cached in sessionStorage for the session.
 */

const CACHE_KEY = 'bdrs_wasm_capable';
const PROBE_URL = '/vendor/bdrs-wasm/bdrs-validator.wasm';

let cachedResult = null;

const hasWebAssembly = () => {
    return typeof WebAssembly === 'object'
        && typeof WebAssembly.instantiate === 'function'
        && typeof WebAssembly.compile === 'function';
};

const hasSharedArrayBuffer = () => {
    return typeof SharedArrayBuffer === 'function';
};

const probeGoWasm = async () => {
    try {
        const response = await fetch(PROBE_URL, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch {
        return false;
    }
};

const detectCapabilities = async () => {
    if (cachedResult !== null) {
        return cachedResult;
    }

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            cachedResult = JSON.parse(cached);
            return cachedResult;
        } catch {
            sessionStorage.removeItem(CACHE_KEY);
        }
    }

    const wasm = hasWebAssembly();
    const sab = hasSharedArrayBuffer();
    const probe = wasm ? await probeGoWasm() : false;

    const result = {
        wasm,
        sharedArrayBuffer: sab,
        goProbe: probe,
        capable: wasm && sab && probe,
    };

    cachedResult = result;
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {
        // sessionStorage may be full or unavailable; proceed without cache
    }

    return result;
};

const isCapable = async () => {
    const result = await detectCapabilities();
    return result.capable;
};

const resetCache = () => {
    cachedResult = null;
    sessionStorage.removeItem(CACHE_KEY);
};

export { detectCapabilities, isCapable, resetCache };
