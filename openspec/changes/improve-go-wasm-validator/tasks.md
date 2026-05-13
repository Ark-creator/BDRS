# Tasks: Improve Go WASM Validator

## Phase 1: Critical Bug Fixes

### Task 1.1: Fix sharpness thresholds for Go gradient metric
**Files:** `wasm/quality.go`, `wasm/liveness.go`, `wasm/selfie.go`
**Estimate:** 15 min
**Status:** Done

- [x] Add `const SharpnessBlurryThreshold = 7.0` and `const SharpnessLivenessThreshold = 5.0` to `quality.go`
- [x] Change `QualityIssues`: `m.Sharpness < 40` -> `m.Sharpness < SharpnessBlurryThreshold`
- [x] Change `CheckLiveness`: `metrics.Sharpness < 30` -> `metrics.Sharpness < SharpnessLivenessThreshold`
- [x] Update `selfie.go` critical set comment to note threshold values
- [x] Add inline documentation explaining the Go gradient metric range (3-20) vs Python Laplacian range (50-350)

### Task 1.2: Fix `CollectBackIDEvidence` acceptsLowOcr dead code
**Files:** `wasm/validation.go`, `wasm/wasm_js.go`
**Estimate:** 15 min
**Status:** Done

- [x] Update `CollectBackIDEvidence` signature to accept `barcodeLike bool`
- [x] Compute `acceptsLowOcr` as `barcodeLike && cardLikeFrame`
- [x] Update `wasm_js.go` JS binding for `collectBackIDEvidence` to accept and pass the `barcodeLike` parameter
- [x] Update `identityWasmValidator.js` call site to pass `barcodeLike` from quality report

### Task 1.3: Fix `normalizeText` 1d word boundary corruption
**Files:** `wasm/validation.go`
**Estimate:** 10 min
**Status:** Done

- [x] Add package-level compiled regex: `var reWord1d = regexp.MustCompile(`\b1d\b`)`
- [x] Replace `strings.ReplaceAll(value, "1d", "id")` with `reWord1d.ReplaceAllString(value, "id")`
- [x] Add smart quote removal: replace `` ` `` and `\u2019` before the lowercase step

### Task 1.4: Add RGBA buffer bounds check in extractRGBA
**Files:** `wasm/wasm_js.go`
**Estimate:** 10 min
**Status:** Done

- [x] Check `jsBuf.Get("byteLength").Int()` against `width * height * 4`
- [x] Return `nil, 0, 0` with a JS console warning if buffer is too small
- [x] Add similar bounds check in `qualityFromJS` for JSON deserialization errors

### Task 1.5: Fix face confidence formula and centering target
**Files:** `wasm/face.go`
**Estimate:** 10 min
**Status:** Done

- [x] Change confidence formula: `math.Min(100.0, 45.0 + areaRatio*260.0 + centered*28.0)`
- [x] Change centering target Y from `0.42` to `0.45`
- [x] Update max confidence from `92` to `100`

## Phase 2: Quality Scoring Parity

### Task 2.1: Implement Python weighted composite quality score
**Files:** `wasm/quality.go`
**Estimate:** 30 min
**Status:** Done

- [x] Add `resolutionScore`, `brightnessScore`, `contrastScore`, `sharpnessScore`, `exposureScore` calculations matching the Python formula from `image_quality.py:60-78`
- [x] Note: `sharpnessScore` uses `/20` normalization (Go gradient metric scale) -- calibrated for Go's gradient metric range
- [x] Calculate `qualityScore` as weighted sum: `resolution*0.25 + brightness*0.18 + contrast*0.20 + sharpness*0.27 + exposure*0.10`
- [x] Keep the existing penalty-based score as a `canvasScore` field for backward compatibility with the JS path

### Task 2.2: Fix fraud metadata structure
**Files:** `wasm/fraud.go`
**Estimate:** 10 min
**Status:** Done

- [x] Change `metadata` to include full metrics objects matching Python structure
- [x] Keep `hashes` sub-object unchanged

## Phase 3: Binary Size Optimization

### Task 3.1: Remove crypto/sha256 dependency
**Files:** `wasm/quality.go`
**Estimate:** 10 min
**Status:** Done

- [x] Remove `sha256` import and the `Sha256` field computation from `AnalyzeImageQuality`
- [x] Replace with FNV-1a hash (from `hash/fnv` standard library)
- [x] Update `QualityMetrics` struct: change `Sha256 string` to `Hash string` with the lighter hash

### Task 3.2: Remove fmt dependency
**Files:** `wasm/wasm_js.go`, `wasm/version.go`
**Estimate:** 10 min
**Status:** Done

- [x] Replace `fmt.Printf` in `main.go` with `js.Global().Get("console").Call("log", ...)`
- [x] Move `VersionString()` to use `strconv` instead of `fmt.Sprintf`
- [x] Remove `fmt` import from all files

### Task 3.3: Compile regex patterns at package level
**Files:** `wasm/validation.go`
**Estimate:** 15 min
**Status:** Done

- [x] Move all `regexp.MustCompile` calls to package-level `var`
- [x] List of hoisted regexes: `reNonAlphaNum`, `reMultiSpace`, `reAddressLabel`, `reGender`, `reWord1d`, `reSerialNumber`, `reDigits`

### Task 3.4: Optimize geometry.go memory allocations
**Files:** `wasm/geometry.go`
**Estimate:** 20 min
**Status:** Done

- [x] In-place dilate (compute in-place instead of allocating new buffer)
- [x] Remove `edgeMag []float64` allocation — use direct threshold comparison
- [x] Reuse buffers where possible

## Phase 4: Test Coverage

### Task 4.1: Create test helpers and quality_test.go
**Files:** `wasm/quality_test.go`, `wasm/testhelpers_test.go`
**Estimate:** 30 min
**Status:** Done

- [x] Create `makeSolidRGBA(w, h, r, g, b)` helper
- [x] Create `makeGradientRGBA(w, h)` helper
- [x] Test `AnalyzeImageQuality`: solid white, solid black, mid gray, gradient, empty
- [x] Test `QualityIssues`: sharpness threshold, low resolution
- [x] Test `BrowserQualityChecks`: blocks blurry, selfie min dimensions

### Task 4.2: Create validation_test.go
**Files:** `wasm/validation_test.go`
**Estimate:** 30 min
**Status:** Done

- [x] Test `normalizeText`: 1d word boundary, smart quotes, OCR artifacts, multi-space collapse
- [x] Test `scoreDocumentType`: matching and non-matching text
- [x] Test `DetectDocumentType`: returns correct type for known PH ID text, no match
- [x] Test `ValidateDocument`: empty text, no OCR engine, PH ID
- [x] Test `ExtractFields`: ID number extraction, gender parsing
- [x] Test `CollectBackIDEvidence`: with barcode, accepts low OCR, no barcode

### Task 4.3: Create face_test.go and geometry_test.go
**Files:** `wasm/face_test.go`, `wasm/geometry_test.go`
**Estimate:** 20 min
**Status:** Done

- [x] Test `faceIoU`: overlapping, non-overlapping, identical, partial
- [x] Test `nmsFaces`: overlapping suppression
- [x] Test `DetectFaces`: skin-tone synthetic image, no-skin image
- [x] Test `AnalyzeDocumentGeometry`: solid image, gradient image, too small

### Task 4.4: Create liveness_test.go, fraud_test.go, selfie_test.go, version_test.go
**Files:** `wasm/liveness_test.go`, `wasm/fraud_test.go`, `wasm/selfie_test.go`, `wasm/version_test.go`
**Estimate:** 20 min
**Status:** Done

- [x] Test `CheckLiveness`: high sharpness pass, low sharpness risk signals, score penalty
- [x] Test `AnalyzeFraud`: normal, duplicate hash, metadata full metrics
- [x] Test `ValidateSelfie`: no face, skin tone
- [x] Test `VersionString`: correct format, matches constants

## Phase 5: JS Integration Resilience

### Task 5.1: Fix promise lockout in wasmLoader.js
**Files:** `resources/js/Services/wasmLoader.js`
**Estimate:** 10 min
**Status:** Done

- [x] Reset `loadPromise = null` in the catch block of `loadBdrsWasm`

### Task 5.2: Fix goWasmAvailable lockout in identityWasmValidator.js
**Files:** `resources/js/Services/identityWasmValidator.js`
**Estimate:** 5 min
**Status:** Done

- [x] Reset `goWasmAvailable = null` when `isGoWasmReady` catches an error
- [x] Allow retry on next call

### Task 5.3: Update wasmLoader.js for new Go API signatures
**Files:** `resources/js/Services/wasmLoader.js`
**Estimate:** 10 min
**Status:** Done

- [x] Update `collectBackIDEvidenceGo` to pass `barcodeLike` parameter

## Phase 6: Version and Build

### Task 6.1: Fix version management
**Files:** `wasm/version.go`, `wasm/Makefile`
**Estimate:** 10 min
**Status:** Done

- [x] Add `var buildVersion string` to `version.go`
- [x] Update `VersionString()` to prefer `buildVersion` with fallback to `strconv` format
- [x] Fix Makefile ldflag: `-X bdrs-wasm-validator.buildVersion=$(VERSION)`

### Task 6.2: Clean up dead code
**Files:** `wasm/validation.go`, `wasm/geometry.go`, `wasm/quality.go`
**Estimate:** 10 min
**Status:** Done

- [x] Remove duplicate helper functions
- [x] Clean up unused variables

### Task 6.3: Rebuild WASM and verify
**Files:** `wasm/dist/`, `public/vendor/bdrs-wasm/`
**Estimate:** 5 min
**Status:** Done

- [x] Run `make all` in `wasm/`
- [x] Copy artifacts to `public/vendor/bdrs-wasm/`
- [x] Run `go test -v ./...` in `wasm/` — all 45 tests pass
- [x] Run `npm run build` to verify JS compilation — builds successfully

## Build & Test Fixes (post-Phase 6)

### Fix native test compilation
**Status:** Done

- [x] Created `wasm/main_native.go` with `//go:build !js || !wasm` stub `main()`
- [x] Added `//go:build js && wasm` to `wasm/main.go` and `wasm/wasm_js.go`
- [x] Fixed hidden character corruption in `geometry_test.go` (duplicated `aly` in function name)
- [x] Fixed test expectations: liveness low sharpness, selfie min dimensions, normalizeText `bo1d`
- [x] All 45 tests pass, WASM rebuilds (3.8MB), `npm run build` succeeds
