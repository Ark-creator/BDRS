# WASM Integration

## Overview

The WASM integration enables client-side identity verification by running Go and Python AI models in the browser via WebAssembly. This reduces server load and eliminates network latency for AI inference calls.

## Architecture

```
Browser (JS)          Go WASM               Python WASM (Pyodide)
    |                    |                        |
    |-- wasmDetect.js --|                        |
    |    (capability     |                        |
    |     check)         |                        |
    |                    |                        |
    |-- wasmPipeline.js -|--> analyzeQuality ---->|
    |    (orchestrator)  |--> detectFaces ------->|
    |                    |--> extractFields ----->|
    |                    |--> compareFaces ------->|
    |                    |--> detectLiveness ----->|
    |                    |--> analyzeFraud ------->|
    |                    |                        |
    |-- identityWasmValidator.js                  |
    |    (pre-validation,                         |
    |     falls back to                           |
    |     server POST if                          |
    |     wasm_mode=false)                        |
```

## Phases

- Go WASM: Document geometry analysis, face detection, barcode extraction, field extraction (already deployed).
- Python WASM (Pyodide): OCR (Tesseract), face embedding comparison, liveness detection, fraud analysis.

## Key Files

| File | Purpose |
|------|---------|
| `resources/js/Services/wasmPipeline.js` | 6-step sequential WASM pipeline orchestrator |
| `resources/js/Services/wasmDetect.js` | Browser capability detection with sessionStorage cache |
| `resources/js/Services/wasmLoader.js` | Go WASM module loader |
| `resources/js/Services/wasmHelpers.js` | SharedArrayBuffer helpers |
| `wasm/` | Go WASM source code |
| `python-ai/wasm/` | Python WASM build scripts and Pyodide entry points |
| `wasm/shared_schema.fbs` | Flatbuffers schema for Go↔Python data interchange |

## Build Commands

```bash
# Go WASM
cd wasm && make all

# Python WASM (requires Pyodide)
cd python-ai/wasm && make python-wasm-build
```

## Configuration

Set `IDENTITY_VERIFICATION_WASM_MODE=true` in `.env` to enable client-side WASM processing. Defaults to `false` (server-side only).

When `wasm_mode` is `true`, `IdentityVerificationService::submitForProcessing()` transitions verifications to `STATUS_PROCESSING` instead of `STATUS_QUEUED` and skips dispatching the job chain. The frontend `identityWasmValidator.js` detects this flag and runs the WASM pipeline instead of POSTing to the server.

### CORS / COOP / COEP

To use `SharedArrayBuffer` (required by Go WASM), the app server must serve the verification routes with the following headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Example nginx snippet:

```nginx
location /identity-verification/ {
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
}
```

## Fallback

When `wasm_mode=false` (default), the original server-side pipeline is used:
1. Client POSTs images to `/api/verification/process`
2. Server enqueues a job chain (OCR → Face → Liveness → Fraud → Finalize)
3. Server returns processing status, client polls for result

## Data Flow

1. `wasmDetect.js` checks `WebAssembly`, `SharedArrayBuffer`, runs Go WASM probe → caches in `sessionStorage`
2. `identityWasmValidator.js` checks `window.__bdrsConfig.wasmMode` and capability
3. If capable + enabled → calls `processVerificationWithWasm()` → `wasmPipeline.runPipeline()`
4. Pipeline runs 6 steps sequentially, emitting progress events
5. Final score computed client-side using same thresholds as `VerificationScoreService`
6. Result saved via a lightweight API call
