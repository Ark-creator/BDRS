## ADDED Requirements

### Requirement: Python AI services compile to WASM via Pyodide
The system SHALL compile each Python AI service (ocr.py, face.py, liveness.py, fraud.py) to a separate Pyodide-based WASM bundle loadable in the browser.

#### Scenario: OCR service compiles to WASM
- **WHEN** running `make python-wasm` in the project root
- **THEN** `python-ai/wasm/dist/ocr.wasm` is produced containing the OCR extraction logic
- **THEN** the WASM module exposes a JS-callable function `extractOcr(imageBuffer, documentType)` returning extracted fields and confidence

#### Scenario: Face comparison compiles to WASM
- **WHEN** running `make python-wasm`
- **THEN** `python-ai/wasm/dist/face.wasm` is produced
- **THEN** the WASM module exposes `compareFaces(idFaceBuffer, selfieFaceBuffer)` returning similarity score and face metadata

#### Scenario: Liveness detection compiles to WASM
- **WHEN** running `make python-wasm`
- **THEN** `python-ai/wasm/dist/liveness.wasm` is produced
- **THEN** the WASM module exposes `checkLiveness(selfieBuffer, faceBox)` returning score and pass/fail

#### Scenario: Fraud analysis compiles to WASM
- **WHEN** running `make python-wasm`
- **THEN** `python-ai/wasm/dist/fraud.wasm` is produced
- **THEN** the WASM module exposes `analyzeFraud(idMetrics, selfieMetrics, idHash, selfieHash)` returning fake probability and issues

### Requirement: Build script handles Pyodide dependency fetching
The build system SHALL download the correct Pyodide version and package metadata at build time so each WASM bundle is self-contained.

#### Scenario: Pyodide fetched on first build
- **WHEN** running `make python-wasm` for the first time
- **THEN** the build script downloads Pyodide 0.26+ to `python-ai/wasm/.pyodide/`
- **THEN** subsequent builds reuse the cached download

#### Scenario: Required Python packages included in WASM bundle
- **WHEN** building the OCR WASM module
- **THEN** the bundle includes only the packages needed by ocr.py (e.g., scikit-image, Pillow) to minimize bundle size
- **THEN** unused packages from other services are excluded

### Requirement: WASM modules expose error handling
Each Python WASM module SHALL return structured error objects when inference fails, rather than throwing uncaught exceptions.

#### Scenario: OCR module returns error on corrupt image
- **WHEN** `extractOcr` receives an unreadable image buffer
- **THEN** the function returns `{ error: { code: 'IMAGE_DECODE_FAILED', message: '...' } }` instead of throwing
- **THEN** the orchestrator marks the step as failed and stops the pipeline

### Requirement: Development mode with verbose logging
Python WASM modules SHALL compile with debug symbols in development mode for easier debugging.

#### Scenario: Debug build enabled
- **WHEN** running `make python-wasm DEBUG=1`
- **THEN** the WASM modules include debug symbols and structured error messages with Python tracebacks serialized as JSON
