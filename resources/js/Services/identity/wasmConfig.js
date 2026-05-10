const metaVersion = () => document.querySelector('meta[name="identity-wasm-version"]')?.getAttribute('content');

export const getWasmVersion = () => {
    if (typeof window !== 'undefined' && window.__IDENTITY_WASM_VERSION__) {
        return String(window.__IDENTITY_WASM_VERSION__);
    }
    return metaVersion() || 'v2';
};

export const getTesseractBase = () => {
    const version = getWasmVersion();
    return `/wasm/${version}/tesseract`;
};
