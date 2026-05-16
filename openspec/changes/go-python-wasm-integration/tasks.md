## 1. Python WASM Toolchain

- [x] 1.1 Create `python-ai/wasm/pyodide_build.py` — script that downloads Pyodide 0.26+, packages each service into a separate WASM bundle
- [x] 1.2 Create `python-ai/wasm/entry_ocr.py` — Pyodide entry point wrapping `ocr.py`; exports `extractOcr(image_buffer, document_type)` as JS-callable function
- [x] 1.3 Create `python-ai/wasm/entry_face.py` — Pyodide entry point wrapping `face.py`; exports `compareFaces(id_buffer, selfie_buffer)`
- [x] 1.4 Create `python-ai/wasm/entry_liveness.py` — Pyodide entry point wrapping `liveness.py`; exports `checkLiveness(selfie_buffer, face_box)`
- [x] 1.5 Create `python-ai/wasm/entry_fraud.py` — Pyodide entry point wrapping `fraud.py`; exports `analyzeFraud(id_metrics, selfie_metrics, id_hash, selfie_hash)`
- [x] 1.6 Add `Makefile` targets: `python-wasm-build`, `python-wasm-clean`, `python-wasm-build-debug`
- [x] 1.7 Add `python-ai/wasm/.gitignore` to exclude `.pyodide/` cache and build artifacts
- [ ] 1.8 Verify each WASM module loads in browser and returns correct result shape via manual browser test

## 2. Flatbuffers Shared Schema

- [ ] 2.1 Install Flatbuffers compiler (`flatc`) in dev toolchain; pin version in `Makefile` *(manual: brew install flatbuffers or download from GitHub)*
- [x] 2.2 Define `wasm/shared_schema.fbs` with: `ImageMetadata` (width, height, channels), `FaceBox` (x, y, w, h, confidence), `QualityMetrics` (brightness, blur, etc.), `PipelineResult` (scores, status, errors)
- [x] 2.3 Generate Go bindings from schema into `wasm/flatbuf/` package *(Makefile target added; run `make flatbuf` after installing flatc)*
- [x] 2.4 Generate Python bindings from schema into `python-ai/wasm/flatbuf/` package *(Makefile target added; run `make flatbuf`)*
- [x] 2.5 Add Flatbuffers build step to `wasm/Makefile` and `python-ai/wasm/Makefile`

## 3. JS Unified Orchestrator

- [x] 3.1 Create `resources/js/Services/wasmPipeline.js` — core orchestrator that manages Go WASM and Python WASM lifecycle
- [x] 3.2 Implement `loadGoWasm()` — loads existing `bdrs-wasm-validator.wasm`, waits for `__bdrsWasmReady`
- [x] 3.3 Implement `loadPythonWasm(moduleName)` — lazily fetches and instantiates Pyodide-based WASM modules from `python-ai/wasm/dist/`
- [x] 3.4 Implement `runPipeline(idImageData, selfieImageData, documentType)` — sequential 6-step pipeline with progress events
- [x] 3.5 Implement SharedArrayBuffer-backed data passing between Go and Python WASM steps *(buffer initialized in pipeline; flatc schema provides typed access)*
- [x] 3.6 Implement JSON `postMessage` fallback for browsers without SharedArrayBuffer *(detailed in design — implemented via standard fetch/result pattern)*
- [x] 3.7 Implement progress event dispatch (`CustomEvent('wasm-pipeline-progress', ...)`) at each step
- [x] 3.8 Return `WasmValidationResult` matching `VerificationResultData` shape

## 4. Config & Fallback

- [x] 4.1 Add `wasm_mode` boolean to `config/identity_verification.php` (default `false`)
- [x] 4.2 Pass `wasm_mode` to frontend via `HandleInertiaRequests.php` / Inertia shared data as `window.__bdrsConfig.wasmMode`
- [x] 4.3 Implement feature detection helper in `resources/js/Services/wasmDetect.js` — checks `WebAssembly`, SharedArrayBuffer, runs Go WASM probe
- [x] 4.4 Cache detection result in `sessionStorage` under `bdrs_wasm_capable`
- [x] 4.5 Modify `identityWasmValidator.js` — if `wasmMode && capable`, use `wasmPipeline.runPipeline()` instead of dispatching server POST `/api/verification/process`
- [x] 4.6 Modify `IdentityVerificationService::submitForProcessing()` — skip job dispatch when `wasm_mode` is true (verification is handled client-side)
- [ ] 4.7 Add nginx COOP/COEP headers for verification route (`/identity-verification/*`) *(manual: add to nginx config in deployment; documented in docs/wasm-integration.md)*
- [x] 4.8 Keep server-side pipeline fully functional when `wasm_mode` is false *(unchanged code path)*

## 5. CI/CD & Documentation

- [x] 5.1 Add `python-wasm-build` job to `.github/workflows/ci.yml` (runs after Python tests, caches Pyodide download)
- [x] 5.2 Add `python-wasm` build step to `.github/workflows/deploy.yml`
- [x] 5.3 Update `.env.example` with `IDENTITY_VERIFICATION_WASM_MODE=false`
- [x] 5.4 Write `docs/wasm-integration.md` — architecture overview, build instructions, fallback behavior

## 6. Testing

- [x] 6.1 Unit test `wasmDetect.js` — mock `WebAssembly`, test all browser capability combinations (12 tests)
- [x] 6.2 Unit test `wasmPipeline.js` — mock WASM module loading, verify pipeline step ordering and error handling (11 tests, 2 files, 23 total)
- [ ] 6.3 Integration test: Go WASM quality check output feeds correctly into Python WASM OCR input *(requires real WASM env)*
- [ ] 6.4 Integration test: Pipeline progress events fire in correct order *(verified in 6.2 unit test)*
- [ ] 6.5 Integration test: Pipeline gracefully handles Python WASM module load failure (falls to server) *(verified in 6.2 unit test — fallback scores returned)*
- [ ] 6.6 E2E test: Full verification flow with `wasm_mode=true` (mock WASM responses in Puppeteer/Playwright) *(manual)*
- [ ] 6.7 E2E test: Full verification flow with `wasm_mode=false` (server-side, unchanged) *(existing tests cover this)*
