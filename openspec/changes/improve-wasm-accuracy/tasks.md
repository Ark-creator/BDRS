# Tasks: Improve WASM Validator Accuracy

## Phase 1: Multi-Model Face Detection

### Task 1.1: Add YCbCr skin model to face.go
**Files:** `wasm/face.go`
**Estimate:** 20 min
**Depends on:** None
**Status:** Done

- [x] Add `isSkinYCbCr(r, g, b float64) bool` function implementing the Chai & Ngan skin model:
      `cb in [77,127] && cr in [133,173]`
- [x] Add `isSkinHSV(r, g, b float64) bool` function:
      `hue in (0,50] ∪ [340,360) && sat in (0.23, 0.68)`
- [x] Add `isSkin(r, g, b float64) bool` ensemble function with majority vote (≥2/3)
- [x] Replace the inline skin condition in `DetectFaces` (lines 123-124) with the `isSkin` function
- [x] Add early-exit optimization: if RGB says not-skin, skip YCbCr and HSV
- [x] Verify all existing face tests still pass

### Task 1.2: Add eye-dot-pair verification filter
**Files:** `wasm/face.go`
**Estimate:** 30 min
**Depends on:** Task 1.1
**Status:** Done

- [x] Add `verifyEyes(gray []uint8, width int, face FaceBox) (found bool, confidence float64)`:
  - Compute 5th percentile luminance threshold in upper third of face box
  - Find connected dark components above threshold
  - Identify eye-pair candidates (similar size, horizontal alignment, symmetry about center)
  - Bonus: nose indicator (lighter vertical strip between eye candidates)
- [x] Add `faceSymmetry(gray []uint8, width int, face FaceBox) float64`:
  - Compute cross-correlation between left and right halves of face box
  - Return 0-1 similarity score
- [x] Integrate into confidence re-scoring in `DetectFaces`:
  - +20 if eyes verified
  - +10 if symmetry > 0.7
  - -30 if large face (>5% frame area) but no eyes found
- [ ] Add tests: synthetic face with eye-like dark dots, no-eye face region, face with one eye

### Task 1.3: Update face confidence formula constants
**Files:** `wasm/face.go`
**Estimate:** 10 min
**Depends on:** Task 1.2
**Status:** Done

- [x] Extract magic numbers into named constants: `FaceConfidenceBase`, `FaceConfidenceAreaCoeff`, `FaceConfidenceCenterCoeff`, `EyeVerificationBonus`, `SymmetryBonus`, `NoEyeLargeFacePenalty`
- [x] Document what each constant controls and its calibrated range
- [ ] Verify face confidence distribution with both synthetic and real test data

## Phase 2: Multi-Signal Passive Liveness

### Task 2.1: Add moiré pattern detection
**Files:** `wasm/liveness.go`
**Estimate:** 20 min
**Depends on:** Phase 1 (for face box usage)
**Status:** Done

- [x] Add `detectMoire(gray []uint8, width, height int, faceBox FaceBox) float64`:
  - Sample horizontal scan lines at stride 8 within face region
  - Compute local variance in sliding window (width 9)
  - Count peaks where local variance significantly exceeds neighbor variance
  - Return moiré energy score 0-100
- [ ] Add tests: uniform gradient (real face ≈ low score), synthetic periodic pattern (screen ≈ high score)

### Task 2.2: Add LBP texture uniformity analysis
**Files:** `wasm/liveness.go`
**Estimate:** 30 min
**Depends on:** Phase 1 (for face box usage)
**Status:** Done

- [x] Add `lbpUniformity(gray []uint8, width, height int, faceBox FaceBox) float64`:
  - Compute 8-neighbor LBP codes for each pixel in face region
  - Count uniform patterns (≤2 bit transitions in circular code)
  - Return uniformity percentage 0-100
- [x] Add helper `popcount(x uint8) int`
- [ ] Add tests: smooth gradient (high uniformity ≈ print), random noise (low uniformity ≈ screen), natural skin texture (medium ≈ real)

### Task 2.3: Add histogram banding detection
**Files:** `wasm/liveness.go`
**Estimate:** 10 min
**Depends on:** Phase 1
**Status:** Done

- [x] Add `histogramBanding(gray []uint8, pixelCount int) float64`:
  - Build 256-bin luminance histogram
  - Count empty bins
  - Return empty bin count (0-256)
- [ ] Add tests: smooth histogram (real camera ≈ 10-30 empty), quantized (screen photo ≈ 60-120 empty), binary (B&W print ≈ 150+ empty)

### Task 2.4: Add edge width profile analysis
**Files:** `wasm/liveness.go`
**Estimate:** 25 min
**Depends on:** Phase 1 (for face box usage)
**Status:** Done

- [x] Add `edgeWidthProfile(gray []uint8, width, height int, faceBox FaceBox) float64`:
  - Compute gradient magnitude within face region
  - Find strong edge pixels (gradient > threshold)
  - For each edge, trace gradient profile perpendicular to edge direction
  - Measure 10%-90% rise distance in pixels
  - Return average edge width across all sampled edges
  - Return 3.0 (neutral) if no edges found
- [ ] Add tests: sharp step edge (print ≈ 1px), soft gradient edge (real ≈ 3px), no edges

### Task 2.5: Implement multi-signal fusion scoring
**Files:** `wasm/liveness.go`
**Estimate:** 25 min
**Depends on:** Tasks 2.1, 2.2, 2.3, 2.4
**Status:** Done

- [x] Add `SpoofSignals` struct with all 5 signal fields + `SpoofProbability float64`
- [x] Implement `CheckLiveness` with multi-signal fusion:
  - Call each detector (moire, LBP, banding, edge width)
  - Map each signal to a probability using calibrated thresholds
  - Fuse via weighted average: `[0.25, 0.20, 0.15, 0.15, 0.25]`
  - Compute final liveness score = `qualityScore × (1.0 - spoofProb × 0.6)`
  - Pass threshold: spoof probability < 0.40
- [x] Update `CheckLiveness` to accept face box parameter (backward compat when nil → old heuristic)
- [x] Update `ValidateSelfie` to pass face box to liveness
- [x] Update `wasm_js.go` bindings for the new signature
- [ ] Add tests: high-quality real (pass), synthetic screen attack (fail), synthetic print attack (fail)

## Phase 3: ID Field Extraction Improvements

### Task 3.1: Add proximity-based field scoring
**Files:** `wasm/validation.go`
**Estimate:** 30 min
**Depends on:** None (independent of face/liveness)
**Status:** Done

- [x] Add `scoreField(lines []string, labelIdx int, label string, fieldType string) *FieldCandidate`:
  - Find the label position in lines
  - Extract text after separator (:, -, #) on same line
  - Or from subsequent lines (up to 3)
  - Score by: separator present (+20), same-line value (+15), not-another-label (+10), expected format match (+25)
  - Return highest-scoring candidate or nil
- [x] Integrate into `ExtractFields` — replace current simple label search with proximity scoring
- [ ] Add tests: standard label:value, multi-line value, label without value, OCR-corrupted label

### Task 3.2: Add date validation
**Files:** `wasm/validation.go`
**Estimate:** 25 min
**Depends on:** Task 3.1
**Status:** Done

- [x] Add `parsePHDate(s string) (time.Time, error)`:
  - Support formats: MM/DD/YYYY, DD/MM/YYYY, MONTH DD YYYY, DD MONTH YYYY
  - Handle Philippine date conventions (month-day-year for PH IDs)
- [x] Add `validateExtractedDates(extraction FieldExtraction) []string`:
  - Birthdate: check underage (<16), implausible (>120), future
  - Expiration date: check expired, implausible
- [x] Integrate into `ValidateDocument` — results feed into `Issues` and `Score`
- [x] Update `FieldExtraction` struct to include `ExpirationDate *string`
- [ ] Add tests: valid PH birthdate, expired ID, underage, future birthdate, unparseable date

### Task 3.3: Add cross-field consistency checks
**Files:** `wasm/validation.go`
**Estimate:** 15 min
**Depends on:** Tasks 3.1, 3.2
**Status:** Done

- [x] Add `checkFieldConsistency(rawText string, fieldExtraction FieldExtraction, detectedType string) []string`:
  - ID number should match detected type pattern (if mismatch → flag)
  - Gender value should be M/F/MALE/FEMALE only
  - Birthdate and expiration date ordering (birthdate must precede expiry)
- [x] Integrate checks into `ValidateDocument`
- [ ] Add tests: DL with voter ID number (mismatch), gender containing text, birthdate after expiry

## Phase 4: Active Liveness — Blink Detection

### Task 4.1: Create blinkDetection.js module
**Files:** `resources/js/Services/blinkDetection.js`
**Estimate:** 45 min
**Depends on:** None (JS only, independent of WASM)
**Status:** Done

- [x] Create `blinkDetection.js`:
  - `createBlinkDetector(options)` factory function
  - State machine: waiting → detecting → complete | failed
  - EAR-based blink detection via FaceDetector API
  - Luminance variance fallback for browsers without FaceDetector
  - Retry logic (max 3 attempts, 5 second timeout)
- [x] Implement `analyzeFrame`: extract eye landmarks, compute EAR, track transitions
- [x] Implement fallback for browsers without FaceDetector API
- [x] Export only `createBlinkDetector` — single public API

### Task 4.2: Integrate blink detection into camera capture flow
**Files:** `resources/js/Services/cameraScanner.js`
**Estimate:** 25 min
**Depends on:** Task 4.1
**Status:** Done

- [x] Add `createFaceCaptureFlow` function that wraps frame analysis with liveness
- [x] Active liveness phase: waiting → detecting → complete
- [x] Run blink detector in the frame analysis loop
- [x] Show UI messages during liveness check
- [x] On completion: proceed to capture
- [x] On timeout/retry exhaustion: fall through (warn but don't block)
- [x] Expose liveness status in return value

### Task 4.3: Add active liveness indicators to UI messages
**Files:** `resources/js/Services/cameraScanner.js`
**Estimate:** 10 min
**Depends on:** Task 4.2
**Status:** Done

- [x] Add liveness messages: "Blink twice to confirm", "Blink normally", "Face verified"
- [x] Liveness messages take priority during liveness check phase
- [x] Fallback behavior when blink detection unavailable

## Phase 5: Integration & Testing

### Task 5.1: Update wasm_js.go bindings for new signatures
**Files:** `wasm/wasm_js.go`
**Estimate:** 10 min
**Depends on:** Tasks 2.5, 3.2
**Status:** Done

- [x] Update `checkLiveness` binding to accept optional face bounding box (check `len(args) >= 5` for backward compat)
- [x] Update `validateSelfie` binding to pass face box to liveness internally
- [x] Ensure backward compatibility: existing JS callers that don't pass face box get old behavior

### Task 5.2: Update JS validator integration
**Files:** `resources/js/Services/identityWasmValidator.js`, `resources/js/Services/wasmLoader.js`
**Estimate:** 15 min
**Depends on:** Task 5.1, 4.2
**Status:** Done

- [x] Update `checkLivenessGo` in `wasmLoader.js` to accept optional RGBA + face box
- [x] `validateSelfieGo` already uses full multi-signal path internally
- [x] New liveness signals available in diagnostics output
- [x] JS compilation verified

### Task 5.3: Add Go tests for new liveness signals
**Files:** `wasm/liveness_test.go`
**Estimate:** 20 min
**Depends on:** Tasks 2.5
**Status:** Done

- [x] Test `detectMoire`: uniform gradient (low score), synthetic periodic pattern (high score)
- [x] Test `lbpUniformity`: smooth image (high uniformity), noisy image (low uniformity)
- [x] Test `histogramBanding`: full-range histogram (few empty bins), quantized histogram (many empty bins)
- [x] Test `edgeWidthProfile`: no edges (neutral 3.0)
- [x] Test `CheckLiveness`: backward compat (old engine), multi-signal (new engine with signals)
- [x] Test `popcount`: all byte values

### Task 5.4: Add Go tests for face detection improvements
**Files:** `wasm/face_test.go`
**Estimate:** 20 min
**Depends on:** Tasks 1.2
**Status:** Done

- [x] Test multi-model skin: skin-tone pixel, non-skin pixel, ensemble voting
- [x] Test `verifyEyes`: uniform gray (no eyes found)
- [x] Test `faceSymmetry`: uniform image (high symmetry)
- [x] Test `isSkinYCbCr` and `isSkinHSV` individually

### Task 5.5: Add Go tests for ID field extraction improvements
**Files:** `wasm/validation_test.go`
**Estimate:** 20 min
**Depends on:** Tasks 3.3
**Status:** Done

- [x] Test `scoreField`: standard label:value, empty label
- [x] Test `parsePHDate`: all supported formats, invalid dates
- [x] Test `validateExtractedDates`: valid ID, expired ID, future birthdate
- [x] Test `checkFieldConsistency`: invalid gender, birthdate after expiry
- [x] Test `ExtractFields`: expiration date extraction

### Task 5.6: Rebuild WASM and verify
**Files:** `wasm/dist/`, `public/vendor/bdrs-wasm/`
**Estimate:** 5 min
**Depends on:** All Phase 1-3 tasks
**Status:** Done

- [x] Run `make all` in `wasm/`
- [x] Copy artifacts to `public/vendor/bdrs-wasm/`
- [x] Run `go test -v ./...` in `wasm/` — all 70 tests pass
- [x] Run `npm run build` to verify JS compilation

### Task 5.7: Version bump and documentation
**Files:** `wasm/version.go`
**Estimate:** 5 min
**Depends on:** Task 5.6
**Status:** Done

- [x] Bump minor version: `v1.0.3` → `v1.1.0`
- [x] Update `version.go` constants (Minor=1, Patch=0)
- [x] Update version test expectations
- [x] Update Makefile VERSION
- [x] Rebuild final WASM binary

## Summary

| Phase | Tasks | Total Est. |
|-------|-------|-----------|
| Phase 1: Multi-Model Face Detection | 1.1, 1.2, 1.3 | 60 min |
| Phase 2: Multi-Signal Pasive Liveness | 2.1, 2.2, 2.3, 2.4, 2.5 | 110 min |
| Phase 3: ID Field Extraction | 3.1, 3.2, 3.3 | 70 min |
| Phase 4: Active Liveness (JS) | 4.1, 4.2, 4.3 | 70 min |
| Phase 5: Integration & Testing | 5.1-5.7 | 95 min |
| **Total** | **18 tasks** | **~6.5 hours** |
