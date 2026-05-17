## ADDED Requirements

### Requirement: Browser feature detection before WASM pipeline
The system SHALL detect WASM and SharedArrayBuffer support before initializing the client-side pipeline and fall back to the server-side API when unsupported.

#### Scenario: WASM supported, pipeline initializes
- **WHEN** the user lands on the verification page
- **THEN** the client checks `typeof WebAssembly === 'object'`
- **THEN** if supported, it loads the Go WASM probe (a minimal ~10KB module)
- **THEN** the probe confirms SharedArrayBuffer support

#### Scenario: WASM unsupported, server-side flow used
- **WHEN** `WebAssembly` is undefined or the Go WASM probe fails
- **THEN** the client sets `window.__bdrsConfig.wasmMode = false`
- **THEN** the upload form submits normally, dispatching server-side jobs

#### Scenario: Probe result cached for session
- **WHEN** the feature detection completes
- **THEN** the result is stored in `sessionStorage` key `bdrs_wasm_capable`
- **THEN** subsequent page visits skip the probe and use the cached value

### Requirement: Config flag controls pipeline selection
The system SHALL check `identity_verification.wasm_mode` config to determine which pipeline to use.

#### Scenario: WASM mode enabled
- **WHEN** `IDENTITY_VERIFICATION_WASM_MODE=true` in `.env`
- **THEN** `config('identity_verification.wasm_mode')` returns `true`
- **THEN** the frontend boot script inlines the config as `window.__bdrsConfig.wasmMode = true`
- **THEN** the client-side WASM pipeline is used for verification

#### Scenario: WASM mode disabled
- **WHEN** `IDENTITY_VERIFICATION_WASM_MODE` is not set or is `false`
- **THEN** the server-side job dispatch pipeline operates as before
- **THEN** no WASM modules are loaded in the browser

### Requirement: Server-side pipeline always available
The system SHALL keep the existing Laravel job chain (OCRProcessingJob → FaceVerificationJob → LivenessDetectionJob → FraudAnalysisJob → FinalizeIdentityVerificationJob) intact and functional regardless of WASM mode.

#### Scenario: Server pipeline processes when WASM mode is off
- **WHEN** `wasm_mode` is `false`
- **THEN** `IdentityVerificationService::submitForProcessing()` dispatches the job chain as before
- **THEN** the Python AI HTTP service handles inference
- **THEN** the verification completes normally

#### Scenario: Status and result endpoints unchanged
- **WHEN** either pipeline completes a verification
- **THEN** the `GET /api/verification/status/{uuid}` and `GET /api/verification/result/{uuid}` endpoints return identical response shapes
- **THEN** client rendering code works unchanged
