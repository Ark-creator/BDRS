export const ACTIVE_WASM_VERSION = 'v2';

export const WASM_VERSION_PATHS = {
    v1: '/vendor/tesseract',
    v2: '/wasm/v2/tesseract',
};

export const getWasmBasePath = (version = ACTIVE_WASM_VERSION) => (
    WASM_VERSION_PATHS[version] || WASM_VERSION_PATHS.v2
);

export const getWasmManifestPath = (version = ACTIVE_WASM_VERSION) => (
    `/wasm/${version}/manifest.json`
);
