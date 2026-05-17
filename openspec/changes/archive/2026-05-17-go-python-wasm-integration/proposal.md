## Why

The current architecture requires ID/face validation to go through a server-side Python AI API endpoint, adding latency, server cost, and a single point of failure. By compiling both Go and Python to WASM and running them directly in the browser, all image validation — OCR, face comparison, liveness, fraud analysis — executes client-side with zero server round trips, lower latency, and offline-capable validation.

## What Changes

- Compile Python AI services (OCR, face comparison, liveness, fraud, selfie) to WASM via Pyodide or py2wasm
- Expose Python AI functions as JS-callable WASM bindings alongside existing Go WASM bindings
- Build a unified JS orchestrator (`wasmPipeline.js`) that calls Go WASM for quality/geometry checks and Python WASM for AI inference
- Remove the server-side `/api/verification/process` chain (jobs → Python AI HTTP calls) when WASM mode is active
- Add a config flag `identity_verification.wasm_mode` to toggle between server-side and client-side validation
- Update client-side verification flow to call unified WASM pipeline instead of dispatching server jobs
- Keep server-side pipeline as fallback for browsers that don't support WASM or when WASM mode is disabled

## Capabilities

### New Capabilities
- `browser-ai-pipeline`: Client-side AI validation pipeline combining Go WASM (quality/geometry) and Python WASM (OCR, face, liveness, fraud) with a unified JS orchestrator
- `python-wasm-compiler`: Compilation toolchain and build process for converting Python AI services to WASM-compatible bundles
- `wasm-fallback-mode`: Graceful degradation — server-side API fallback when browser lacks WASM support or WASM mode is disabled

### Modified Capabilities
*(None — first time specs are being introduced for this area)*

## Impact

- **python-ai/**: Each service (ocr.py, face.py, liveness.py, fraud.py, selfie.py, image_quality.py) needs WASM-compatible entry points; `requirements.txt` may need WASM-compatible package variants
- **wasm/**: New `python-wasm/` subdirectory for compiled Python WASM bundles; shared message format between Go WASM ↔ Python WASM
- **resources/js/Services/**: New `wasmPipeline.js` orchestrator; modify `identityWasmValidator.js` to use unified pipeline
- **app/Jobs/IdentityVerification/**: Jobs become conditional — skipped when WASM mode is active
- **config/identity_verification.php**: New `wasm_mode` boolean config key
- **CI/CD**: Python WASM build step added to `.github/workflows/ci.yml`
- **BREAKING**: Verification flow changes from async (jobs → queue) to synchronous (browser) when WASM mode is on; API consumers may see different timing
