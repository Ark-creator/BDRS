## ADDED Requirements

### Requirement: Unified WASM orchestrator loads both Go and Python modules
The system SHALL provide a JavaScript orchestrator (`wasmPipeline.js`) that loads the Go WASM validator and Python WASM inference modules in the browser and executes a sequential validation pipeline.

#### Scenario: Orchestrator loads Go WASM successfully
- **WHEN** the page initializes with `wasm_mode=true`
- **THEN** the orchestrator loads `bdrs-wasm-validator.wasm` and waits for `__bdrsWasmReady` flag

#### Scenario: Orchestrator loads Python WASM on demand
- **WHEN** Go WASM pre-processing passes and AI inference is needed
- **THEN** the orchestrator lazily loads the required Python WASM module (ocr, face, liveness, or fraud)

#### Scenario: Pipeline runs complete validation
- **WHEN** user uploads ID image and selfie, then triggers verification
- **THEN** the orchestrator runs: (1) Go WASM image quality check, (2) Go WASM face detection, (3) Python WASM OCR, (4) Python WASM face comparison, (5) Python WASM liveness, (6) Python WASM fraud analysis
- **THEN** the orchestrator returns a final result object with scores, extracted data, and validation flags

### Requirement: Image data shared between Go and Python WASM via SharedArrayBuffer
The system SHALL pass image pixel data (RGBA buffers), detected face boxes, and quality metrics between Go WASM and Python WASM using SharedArrayBuffer / Flatbuffers to avoid serialization overhead.

#### Scenario: Go WASM writes face detection results for Python WASM
- **WHEN** Go WASM detects faces in the selfie image
- **THEN** the face box coordinates, quality metrics, and face count are written to the shared buffer
- **THEN** Python WASM reads these values without JSON round-trip

#### Scenario: Fallback to JSON when SharedArrayBuffer unavailable
- **WHEN** the browser does not support SharedArrayBuffer (missing COOP/COEP headers)
- **THEN** the orchestrator falls back to JSON-serialized messages via a shared worker's `postMessage`

### Requirement: Validation results returned as structured object
The orchestrator SHALL return a `WasmValidationResult` object matching the existing `VerificationResultData` shape so the client can use the same rendering code.

#### Scenario: Result shape matches server response
- **WHEN** the pipeline completes
- **THEN** the result contains: `id`, `status`, `document_type`, `scores` (face_match, ocr_confidence, fake_probability, liveness_score, overall_score), `extracted_data`, `document_validation`, `failure_reason`
- **THEN** the client renders the result using the existing `VerificationResult` component

### Requirement: Pipeline reports progress per step
The orchestrator SHALL emit progress events at each pipeline step so the UI can show a progress indicator.

#### Scenario: Progress events emitted during verification
- **WHEN** each pipeline step starts
- **THEN** the orchestrator dispatches a CustomEvent `wasm-pipeline-progress` with detail `{ step: 'quality' | 'face_detection' | 'ocr' | 'face_compare' | 'liveness' | 'fraud', status: 'running' | 'done' | 'error' }`
