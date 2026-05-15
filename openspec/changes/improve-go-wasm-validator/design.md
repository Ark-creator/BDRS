# Design: Improve Go WASM Validator

## Architecture Overview

The Go WASM validator operates as a browser-side module loaded via `wasm_exec.js`. JavaScript calls Go functions through `syscall/js` bindings, passing RGBA pixel data in and receiving JSON-serialized results back. The module sits between the registration page (`Register.jsx`) and the existing JS-only validator (`identityWasmValidator.js`), with the JS path serving as fallback.

```
Register.jsx
  -> identityWasmValidator.js (orchestrator)
    -> wasmLoader.js (loads Go WASM)
    -> Go WASM (quality, face, validation, liveness, fraud, selfie)
    -> Tesseract.js (OCR, unchanged)
    -> JS Canvas fallback (if Go WASM unavailable)
```

## Bug Fixes

### 1. Sharpness Threshold Calibration (C-02)

**Problem:** `QualityIssues` uses `< 40` and `CheckLiveness` uses `< 30` for sharpness -- these are Python Laplacian variance thresholds. Go computes gradient magnitude average (typical range 3-20), so every image triggers "blurry".

**Solution:** Calibrate Go-specific thresholds based on the gradient magnitude average metric. The JS fallback uses `< 3.2` (blocking) and `< 7` (soft). Map these to Go:

| Check | Current | New |
|---|---|---|
| `QualityIssues` blurry | `< 40` | `< 7` |
| `CheckLiveness` screen penalty | `< 30` | `< 5` |

Add `SharpnessScale` constant to `quality.go` documenting the metric type.

### 2. Back-of-ID `acceptsLowOcr` (C-01)

**Problem:** `CollectBackIDEvidence` hardcodes `acceptsLowOcr = false`, making two `isValid` branches unreachable.

**Solution:** Accept `barcodeSignal` as a parameter (or as part of `QualityMetrics`). The caller (`identityWasmValidator.js`) already has `barcode_signal` from the quality analysis. Add `BarcodeLike bool` to the Go function signature:

```go
func CollectBackIDEvidence(rawText string, metrics QualityMetrics, barcodeLike bool, expectedScore int) map[string]interface{}
```

### 3. Word-Boundary `1d` Replacement (H-01)

**Problem:** `normalizeText` replaces all `1d` without word boundaries.

**Solution:** Use `regexp.MustCompile(`\b1d\b`)` as a package-level compiled regex, matching the JS behavior.

### 4. RGBA Buffer Bounds Check (H-03)

**Problem:** `extractRGBA` panics if the JS buffer is smaller than `width * height * 4`.

**Solution:** Check `jsBuf.Get("byteLength").Int()` before creating the `Uint8Array` view. Return `nil, 0, 0` if too small.

### 5. Face Confidence Formula (H-04, H-05)

**Problem:** Go uses different coefficients and centering target than Python.

**Solution:** Align with the Python formula:
- Base: `45.0`
- Area coefficient: `260.0`
- Center coefficient: `28.0`
- Max: `100.0`
- Center target Y: `0.45`

### 6. Quality Scoring Parity (H-02)

**Problem:** Go uses penalty-deduction scoring; Python uses weighted composite. Different `quality_score` values break downstream fraud/liveness/selfie calculations.

**Solution:** Adopt the Python weighted composite formula in Go:

```go
resolutionScore := min(100.0, float64(width*height)/(900*600)*100)
brightnessScore := max(0.0, 100.0 - abs(brightness-128)/128*100)
contrastScore := min(100.0, contrast/64*100)
sharpnessScore := min(100.0, sharpness/350*100)  // normalized for Laplacian-scale
exposureScore := max(0.0, 100 - darkRatio*110 - brightRatio*90 - max(0, 40-dynamicRange)*1.35)
qualityScore := round(resolution*0.25 + brightness*0.18 + contrast*0.20 + sharpness*0.27 + exposure*0.10, 2)
```

Keep the JS penalty-deduction formula unchanged (it has its own calibrated thresholds for the Canvas path).

## Test Coverage Design

### Test Structure

```
wasm/
  quality_test.go      -- AnalyzeImageQuality, QualityIssues, BrowserQualityChecks
  geometry_test.go     -- AnalyzeDocumentGeometry
  face_test.go         -- DetectFaces, nmsFaces, faceIoU
  validation_test.go   -- normalizeText, scoreDocumentType, ValidateDocument, ExtractFields, EstimateBarcodeSignal, CollectBackIDEvidence
  liveness_test.go     -- CheckLiveness
  fraud_test.go        -- AnalyzeFraud
  selfie_test.go       -- ValidateSelfie
  version_test.go      -- VersionString, FullVersion
```

### Test Data Strategy

- Generate synthetic RGBA pixel data in tests (no external files needed)
- Create helper functions: `makeSolidImage(w, h, r, g, b)`, `makeGrayscaleGradient(w, h)`, `makeFaceImage(w, h)`
- Test against known pixel values where thresholds are critical
- Use table-driven tests for threshold boundary conditions

### Key Test Cases

| Function | Critical Tests |
|---|---|
| `normalizeText` | `1d` word boundary, smart quotes, common OCR artifacts |
| `AnalyzeImageQuality` | Pure white, pure black, gradient, known brightness values |
| `scoreDocumentType` | Each profile's keywords and ID patterns |
| `DetectFaces` | Skin-tone image, no-skin image, multiple faces |
| `CollectBackIDEvidence` | `acceptsLowOcr=true/false`, marker hits, serial numbers |
| `CheckLiveness` | Sharpness threshold boundary (5.0), contrast boundary |
| `ValidateDocument` | Empty text, PH markers, each doc profile, back side logic |

## Binary Size Optimization

### Phase 1: Quick Wins (~350 KB savings)

1. **Remove `crypto/sha256`** from `quality.go` -- the hash is only used for dedup and is not critical for browser-side validation. Replace with a simple XOR checksum or remove entirely. **Saves ~250 KB.**

2. **Remove `fmt`** from `main.go` -- replace `fmt.Printf` with `js.Global().Get("console").Call("log", ...)`. **Saves ~100 KB.**

3. **Move regex compilation to package-level `var`** in `validation.go` -- saves repeated compilation overhead (no size savings but significant runtime improvement).

4. **Fix `VersionString`** to use `fmt.Sprintf` with constants, then remove the standalone `fmt` import by using `js` console for logging.

### Phase 2: Memory Optimization

1. **`geometry.go`**: Use `[]uint8` instead of `[]float64` for edge magnitudes (saves ~10 MB per call).
2. **`geometry.go`**: Reuse buffers (`edgeBinary` -> `dilate` in-place).
3. **`quality.go`**: Use `[]float32` instead of `[]float64` for grayscale (saves ~4.6 MB per call).
4. **JS integration**: Pass `ArrayBuffer` reference instead of copying RGBA data for each function call.

## JS Integration Resilience

### Promise Lockout Fix (M-01, M-02)

```js
// Before: permanent lockout
let loadPromise = null;
loadPromise = (async () => { /* may reject */ })();

// After: reset on failure
loadPromise = (async () => {
    try {
        // ... load WASM ...
    } catch (e) {
        loadPromise = null; // allow retry
        throw e;
    }
})();
```

Same pattern for `goWasmAvailable` in `identityWasmValidator.js`.

### Error Handling

- Add `byteLength` validation in `extractRGBA`
- Return structured errors from Go WASM functions instead of silently returning nil/zero
- Add `window.__bdrsWasmError` for diagnostics

## Version Management

- Fix `VersionString()` to use `Major`, `Minor`, `Patch` constants
- Fix Makefile `-ldflags` to reference an actual `var buildVersion string`
- Add `buildVersion` as a string variable set via ldflags, with `VersionString()` preferring it over the constant-derived default
