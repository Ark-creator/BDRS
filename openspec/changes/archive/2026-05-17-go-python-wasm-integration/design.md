## Context

The project has two independent WASM-compilable stacks: Go (`wasm/`) for client-side image quality, document geometry, face detection, and liveness heuristics; Python (`python-ai/`) for server-side AI inference (OCR, face comparison, liveness scoring, fraud analysis). Currently, the Python AI runs as an HTTP service called from Laravel jobs. This design compiles the Python AI to WASM so both stacks run in the browser, eliminating the HTTP API round trip.

## Goals / Non-Goals

**Goals:**
- Compile Python AI inference functions to WASM bundles loadable in the browser
- Expose Python AI functions (OCR, face compare, liveness, fraud) as JS-callable bindings alongside existing Go WASM API
- Build a unified JS orchestrator (`wasmPipeline.js`) that calls Go WASM for pre-processing and Python WASM for AI inference
- Add `identity_verification.wasm_mode` config to toggle between browser-side and server-side pipelines
- Keep server-side pipeline intact as a fallback for incompatible browsers

**Non-Goals:**
- Rewriting Python AI logic in Go or vice versa
- Supporting WASM in Node.js server-side (browser-only)
- Real-time camera capture or WebGL acceleration
- WASM-level sandboxing beyond browser security model

## Decisions

1. **Toolchain: Pyodide over py2wasm** — Pyodide is mature, supports NumPy/scikit-image (which the OCR preprocessing uses), and allows loading individual Python modules on demand. py2wasm is experimental and struggles with C-extensions. Pyodide's ~12MB baseline is acceptable given the quality benefits.

2. **Shared message format: Flatbuffers over JSON** — The Go WASM ↔ Python WASM data flow (image buffers, face boxes, scores) is high-frequency (multiple frames). JSON serialization between two WASM runtimes adds latency. Flatbuffers enables zero-copy reads. The Go WASM already uses structured types, so adding Flatbuffers compilation to both sides is straightforward. Fallback to JSON for simple metadata.

3. **Python WASM entry points: Single worker per service** — Each Python AI service (ocr, face, liveness, fraud) compiles to a separate WASM module loaded on demand. This keeps individual bundle sizes small (~2-4MB each vs 12MB monolithic) and allows lazy loading. Go WASM remains as one module since it is already <1MB.

4. **Orchestration: Sequential pipeline in SharedArrayBuffer** — The pipeline runs: (a) Go WASM validates image quality → (b) if passes, Go WASM detects faces → (c) if face found, Python WASM runs OCR → (d) Python WASM face comparison → (e) Python WASM liveness → (f) Python WASM fraud analysis. Results accumulate in a SharedArrayBuffer; Go WASM writes pre-processing output, Python WASM reads it and appends AI results. The JS orchestrator awaits completion of each step.

5. **Config flag: Env-based, default off** — `IDENTITY_VERIFICATION_WASM_MODE=true` in `.env` enables browser-side pipeline. Default `false` preserves backward compatibility. The frontend checks `window.__bdrsConfig.wasmMode` at boot time.

6. **Fallback: Feature detection at upload time** — Before showing the upload form, the client checks `WebAssembly` availability and runs a small Go WASM probe. If WASM is unsupported, the form submits normally (server-side pipeline). The probe result is cached for the session.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Pyodide bundle size (~12MB) slows initial page load | Lazy-load per-service modules; show loading progress; cache via `caches` API with service worker |
| Python WASM performance slower than native for heavy CV ops | Offload pixel ops to Go WASM (already optimized); keep Python for high-level inference only |
| SharedArrayBuffer requires `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers | Add COOP/COEP headers in nginx only for the verification route; test in staging first |
| Browser compatibility gaps (Safari <16.4, Firefox <116) | Fallback detection catches incompatible browsers; server-side pipeline always available |
| Python WASM debugging harder than server-side (no print/log) | Compile with `pyodide --debug` symbols in dev; structured error objects returned to JS |

## Migration Plan

1. **Phase A — Python WASM toolchain**: Set up Pyodide build in `python-ai/wasm/`, create entry-point wrappers for each service, verify compilation succeeds
2. **Phase B — Flatbuffers schema**: Define shared schema for image metadata, face boxes, scores; generate Go and Python bindings
3. **Phase C — JS orchestrator**: Build `wasmPipeline.js` that loads Go WASM, loads Python WASM modules on demand, runs pipeline steps, returns final result
4. **Phase D — Config & fallback**: Add `wasm_mode` config, implement browser feature detection, modify `IdentityVerificationService` to skip job dispatch when WASM mode is active
5. **Phase E — CI & deps**: Add Python WASM build to CI, add COOP/COEP headers to nginx config for verification route, update documentation
6. **Rollback**: Set `IDENTITY_VERIFICATION_WASM_MODE=false` — entire flow reverts to server-side pipeline; no data migration needed

## Open Questions

- Can scikit-image be replaced with a lighter library (e.g., image-corruption, or just Go WASM pixel ops) to reduce Pyodide bundle size?
- Should FaceNet/ONNX models be loaded separately (outside WASM) via browser WebNN API for better performance?
- Is SharedArrayBuffer available in all target browsers, or do we need a `postMessage` fallback between Go ↔ Python workers?
