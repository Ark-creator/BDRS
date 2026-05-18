# Design: Improve WASM Validator Accuracy

## Architecture Overview

The validation pipeline gains two new stages and upgrades two existing stages:

```
Registration Flow (improved)

Camera opens (cameraScanner.js)
    │
    ▼
ACTIVE LIVENESS (NEW — Browser JS)
    ┌─────────────────────────────────────────┐
    │ blinkDetection.js                       │
    │ • Monitors EAR (Eye Aspect Ratio)       │
    │ • Detects 2+ blinks within 5 seconds    │
    │ • Falls through on failure (max 3 retry)│
    └──────────────┬──────────────────────────┘
                   │ capture still
                   ▼
WASM VALIDATION (IMPROVED)
    ┌─────────────────────────────────────────┐
    │ face.go                                 │
    │ • Multi-model skin detection (YCbCr+HSV)│
    │ • Eye-dot-pair verification filter      │
    ├─────────────────────────────────────────┤
    │ liveness.go                             │
    │ • Moiré pattern detection               │
    │ • LBP texture uniformity analysis       │
    │ • Histogram banding (color depth)       │
    │ • Edge width profile                    │
    │ • Multi-signal fusion → spoof_score     │
    ├─────────────────────────────────────────┤
    │ validation.go                           │
    │ • Proximity-based field extraction      │
    │ • Date validation (birthdate, expiry)   │
    │ • Per-document-type layout scoring      │
    └──────────────┬──────────────────────────┘
                   │
                   ▼
Combined WASM score ──► Server-side (unchanged)
```

## Module Changes

### 1. Face Detection — Multi-Model Skin (`wasm/face.go`)

**Current:** Single RGB threshold in `DetectFaces`. Every pixel is classified as skin or not-skin by: `lum > 18 && lum < 252 && r > 30 && g > 18 && b > 10 && (max-min) > 6 && (r-g) > -15 && (r-b) > 2`

**New:** Ensemble of three independent skin models with majority vote:

```go
func isSkin(r, g, b float64) bool {
    votes := 0
    if isSkinRGB(r, g, b)  { votes++ }    // existing, refined
    if isSkinYCbCr(r, g, b) { votes++ }    // new: luminance-independent
    if isSkinHSV(r, g, b)  { votes++ }    // new: hue-stable
    return votes >= 2
}
```

#### YCbCr Model (Chai & Ngan)

```go
func isSkinYCbCr(r, g, b float64) bool {
    y  := 0.299*r + 0.587*g + 0.114*b
    cb := 128 - 0.168736*r - 0.331264*g + 0.5*b
    cr := 128 + 0.5*r - 0.418688*g - 0.081312*b
    return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173
}
```

Advantage: Separates luminance from chrominance — works across lighting conditions. The Cb/Cr ranges are well-established in face detection literature.

#### HSV Model

```go
func isSkinHSV(r, g, b float64) bool {
    maxC := math.Max(r, math.Max(g, b))
    minC := math.Min(r, math.Min(g, b))
    delta := maxC - minC
    var hue float64
    if delta > 0 {
        if maxC == r { hue = 60 * ((g - b) / delta) }
        if maxC == g { hue = 60 * (2 + (b - r) / delta) }
        if maxC == b { hue = 60 * (4 + (r - g) / delta) }
    }
    if hue < 0 { hue += 360 }
    sat := delta / math.Max(1, maxC)
    return (hue > 0 && hue <= 50 || hue >= 340 && hue < 360) && sat > 0.23 && sat < 0.68
}
```

Advantage: Hue is largely invariant to illumination intensity and shadows.

#### Eye-Dot-Pair Verification

After connected component analysis finds candidate face regions, validate each candidate by searching for two dark regions (eyes) in the upper third of the box:

```go
func verifyEyes(gray []uint8, width int, face FaceBox) (found bool, confidence float64) {
    // Compute threshold at 5th percentile luminance in eye region
    // Find connected dark components above threshold
    // Pair criteria:
    //   1. Similar area (within 40%)
    //   2. Horizontal alignment (y-center within 30% of eye region height)
    //   3. Symmetric about face box center (x-offset within 25% each side)
    // Bonus: check for nose indicator (lighter vertical strip between eye candidates)
    // Return: true if ≥1 valid eye pair found, confidence boost if so
}
```

**Confidence re-scoring:**
- Baseline from existing formula (45 + area×260 + centered×28)
- +20 if eyes verified
- +10 if face box is symmetric (left/right half correlation > 0.7)
- -30 if large face (>5% of frame) but no eyes found
- Clamp to [0, 100]

#### Performance optimization

- Use stride-2 sampling for all skin models (current is stride-3)
- Early-exit: if RGB model says not-skin, skip YCbCr and HSV (fast path for non-skin pixels)
- Precompute YCbCr/HSV conversions only for skin-candidate pixels

### 2. Passive Liveness — Multi-Signal Fusion (`wasm/liveness.go`)

**Current:** Single-penalty: `if contrast < 10 || sharpness < 5 → score -= 10`

**New:** Five independent signals, each producing a penalty, fused into a single spoof confidence:

```go
type SpoofSignals struct {
    MoireEnergy        float64 `json:"moire_energy"`        // 0-100
    LBPUniformity      float64 `json:"lbp_uniformity"`      // 0-100
    HistogramBanding   float64 `json:"histogram_banding"`   // 0-100
    EdgeWidthProfile   float64 `json:"edge_width_profile"`  // 0-100
    ExistingPenalty    float64 `json:"existing_penalty"`    // 0-100
}

func computeSpoofConfidence(metrics QualityMetrics, 
                             gray []uint8, width, height int, 
                             faceBox FaceBox) SpoofResult {
    moire := detectMoire(gray, width, height)
    lbp := lbpUniformity(gray, width, height, faceBox)
    banding := histogramBanding(gray, width*height)
    edgeWidth := edgeWidthProfile(gray, width, height, faceBox)
    
    // Map signals to probabilities
    pMoire := clampf((moire - 25) / 50.0, 0, 1)       // >75 → certain
    pLBP := clampf((math.Abs(lbp-70) - 15) / 25.0, 0, 1) // <40 or >85 → suspicious
    pBanding := clampf((banding - 50) / 60.0, 0, 1)     // >110 → certain
    pEdge := clampf((6 - edgeWidth) / 4.0, 0, 1)        // <2px → spoof-like
    pExisting := 0.0
    if metrics.Contrast < 10 { pExisting += 0.4 }
    if metrics.Sharpness < SharpnessLivenessThreshold { pExisting += 0.3 }
    pExisting = math.Min(pExisting, 1.0)
    
    // Weighted fusion (weights determined by signal reliability)
    weights := []float64{0.25, 0.20, 0.15, 0.15, 0.25}
    signals := []float64{pMoire, pLBP, pBanding, pEdge, pExisting}
    
    spoofProb := 0.0
    for i, s := range signals {
        spoofProb += s * weights[i]
    }
    
    result := LivenessResult{
        Engine:  "multi-signal-wasm-go",
        Score:   round2(metrics.QualityScore * (1.0 - spoofProb * 0.6)),
        Passed:  spoofProb < 0.40,
        Signals: map[string]interface{}{
            "moire_energy":        round2(moire),
            "lbp_uniformity":      round2(lbp),
            "histogram_banding":   round2(banding),
            "edge_width_avg":      round2(edgeWidth),
            "spoof_probability":   round2(spoofProb * 100),
        },
    }
    return result
}
```

#### Signal 1: Moiré Detection

```go
func detectMoire(gray []uint8, width, height int) float64 {
    // Sample horizontal scan lines at stride 8
    // For each line, compute local variance in sliding window (width 9)
    // Count peaks where local variance >> neighbor variance
    // Real face: ~5-15% of pixels are peaks, random spacing
    // Screen capture: ~30-60% of pixels are peaks, periodic spacing
    score := 0.0
    for y := 0; y < height; y += 8 {
        peaks := 0
        for x := 4; x < width-4; x++ {
            local := mean8(gray[y*width+x-4 : y*width+x+4])
            neighbor := mean8(gray[y*width+x-8 : y*width+x-4])
            if absf(float64(gray[y*width+x])-local) > 15 &&
               absf(float64(gray[y*width+x])-neighbor) > 10 {
                peaks++
            }
        }
        if float64(peaks)/float64(width) > 0.25 {
            score += 1.0
        }
    }
    return score / float64(height/8) * 100
}
```

#### Signal 2: LBP Uniformity

```go
func lbpUniformity(gray []uint8, width, height int, face FaceBox) float64 {
    // Compute LBP codes within face region
    // LBP = sum of 2^bit where neighbor >= center (8 neighbors)
    // Count uniform patterns (≤2 bit transitions in circular code)
    // Real skin: 60-80% uniform
    // Print: >85% uniform (halftone dots are uniform)
    // Screen: <50% uniform (pixel grid noise)
    uniform, total := 0, 0
    for y := face.Y + 1; y < face.Y+face.Height-1 && y < height-1; y++ {
        for x := face.X + 1; x < face.X+face.Width-1 && x < width-1; x++ {
            center := gray[y*width+x]
            code := computeLBPCode(gray, width, x, y, center)
            transitions := popcount(code ^ (code >> 1))
            if transitions <= 2 { uniform++ }
            total++
        }
    }
    if total == 0 { return 50 }
    return float64(uniform) / float64(total) * 100
}
```

#### Signal 3: Histogram Banding

```go
func histogramBanding(gray []uint8, pixelCount int) float64 {
    hist := make([]int, 256)
    for _, v := range gray[:pixelCount] {
        hist[v]++
    }
    emptyBins := 0
    for i := 0; i < 256; i++ {
        if hist[i] == 0 { emptyBins++ }
    }
    // Real camera: < 30 empty bins
    // Screen photo: 60-120 empty bins (8-bit → 8-bit quantization)
    // B&W print: > 120 empty bins
    return float64(emptyBins)
}
```

#### Signal 4: Edge Width Profile

```go
func edgeWidthProfile(gray []uint8, width, height int, face FaceBox) float64 {
    // Find strong gradient edges in face region
    // For each edge, trace gradient profile perpendicular to edge direction
    // Measure 10%-90% rise distance
    // Real skin-air boundary: 2-4 pixels (soft, natural)
    // Print: 1-2 pixels (sharper, clipped)
    // Screen: 0.5-1 pixel (oversharpened)
    // Return average edge width in pixels
    avgWidth := 0.0
    count := 0
    // ... gradient magnitude computation, edge tracing, profile analysis
    if count == 0 { return 3.0 } // default to "likely real" if no edges
    return avgWidth / float64(count)
}
```

### 3. Active Liveness — Blink Detection (`resources/js/Services/blinkDetection.js`)

New JS module that runs during the camera capture phase, before WASM validation.

```
cameraScanner.js
    │
    ├── frame loop (existing)
    │       │
    │       └── Stats analysis (existing quality checks)
    │
    └── blinkDetection.js (NEW)
            │
            ├── Uses FaceDetector API (or falls back to WASM skin detection)
            ├── Computes Eye Aspect Ratio per frame:
            │
            │    EAR = ||p2 - p6|| + ||p3 - p5||
            │          ────────────────────────
            │              2 * ||p1 - p4||
            │
            │    (6 eye landmark points)
            │
            ├── Tracks EAR over sliding window of 30 frames
            ├── Closed eye threshold: EAR < 0.18
            ├── Open eye threshold: EAR > 0.25
            ├── Requires 2 blink events within 5 seconds
            └── Retry loop: max 3 attempts, then fall through
```

**Fallback:** If `FaceDetector` API is unavailable (Firefox, Safari), the blink detection degrades to tracking the average luminance change in the eye region (detected via WASM face bounding box). Less accurate but still catches the most obvious spoof — a static photo.

**Integration into capture flow:**

```js
// cameraScanner.js additions
import { createBlinkDetector } from './blinkDetection.js';

const blinkDetector = createBlinkDetector({
    requiredBlinks: 2,
    timeoutMs: 5000,
    maxRetries: 3,
});

// In the frame analysis loop:
const blinkResult = blinkDetector.analyzeFrame(video, faceBox);
if (blinkResult.complete) {
    // Active liveness passed — proceed to capture
    captureHighestQualityFrame();
}
```

### 4. ID Field Extraction Improvements (`wasm/validation.go`)

#### Proximity-Based Field Scoring

Current `ExtractFields` finds label keywords and grabs trailing lines. New approach scores candidate field values by proximity to their expected labels:

```go
type FieldCandidate struct {
    Value    string
    LabelIdx int      // line index of the label
    Distance int      // character distance from label end to value start
    Score    float64  // confidence (0-100)
}

func scoreField(lines []string, labelIdx int, label string, fieldType string) *FieldCandidate {
    // Extract text after the label separator (:, -, #) on same line
    // Or from subsequent lines (up to 3)
    // Score by:
    //   - Separator present (+20)
    //   - Same-line value (+15)
    //   - Value doesn't look like another label (+10)
    //   - Value matches expected format for field type (+25)
    // Return highest-scoring candidate, or nil if none found
}
```

#### Date Validation

```go
func validateExtractedDates(extraction FieldExtraction) []string {
    issues := []string{}
    
    if extraction.Birthdate != nil {
        parsed, err := parsePHDate(*extraction.Birthdate)
        if err != nil {
            issues = append(issues, "birthdate_unparseable")
        } else {
            now := time.Now()
            age := now.Year() - parsed.Year()
            if age < 16 { issues = append(issues, "birthdate_underage") }
            if age > 120 { issues = append(issues, "birthdate_implausible") }
            if parsed.After(now) { issues = append(issues, "birthdate_in_future") }
        }
    }
    
    if extraction.ExpirationDate != nil {
        parsed, err := parsePHDate(*extraction.ExpirationDate)
        if err != nil {
            issues = append(issues, "expiry_unparseable")
        } else if parsed.Before(time.Now()) {
            issues = append(issues, "id_expired")
        }
    }
    
    return issues
}
```

The birthdate/expiry date validation feeds into the overall document validation score (currently at `validation.go:326`).

#### Cross-Field Consistency

- Birthdate format should match PH ID conventions (MM/DD/YYYY or Month DD, YYYY)
- Gender should be M/F/MALE/FEMALE
- Extracted ID number should match the detected document type's regex pattern (already partially done, now enforced)
- If the ID has "Driver's License" keywords but the ID number doesn't match DL pattern → flag mismatch

### 5. Updated `wasm_js.go` Bindings

No new exported functions needed. The existing functions are modified:
- `detectFaces` — uses multi-model internally, no API change
- `checkLiveness` — accepts RGBA + face box data for new signals
- `validateSelfie` — integrates new liveness internally
- `validateDocument` — date validation added internally

New parameter: `checkLiveness` will accept an optional face bounding box for signal extraction. API remains backward-compatible (no face box = old heuristic only).

```go
// New signature for checkLiveness
func CheckLiveness(metrics QualityMetrics, 
                   gray []uint8, width, height int, 
                   faceBox *FaceBox) LivenessResult {
    // ...
}
```

### 6. JS Integration — Blink Detection (`resources/js/Services/blinkDetection.js`)

File structure:

```js
export function createBlinkDetector(options) {
    // State: EAR history, blink count, timer, retry count
    // Methods:
    //   analyzeFrame(video, faceBox) → { complete, blinks, ear }
    //   getStatus() → { phase, blinksDetected, retriesRemaining }
    //   reset()
    //
    // Phase machine:
    //   waiting → detecting → complete | failed
    //         ↕                    ↕
    //      retry               retry (max 3)
    //
    // Each frame:
    //   1. Extract eye landmarks from FaceDetector API
    //   2. Compute EAR = (d2+d6 + d3+d5) / (2 * d1+d4)
    //   3. Track state transitions (open→closed→open = 1 blink)
    //   4. Return { complete: true } when ≥2 blinks detected
}
```

Camera integration in `cameraScanner.js`:

The blink detector runs inside the existing `requestAnimationFrame` loop. When it detects 2 blinks within 5 seconds, it signals readiness. The existing auto-capture manager then takes the highest-quality frame.

## Backward Compatibility

- All existing `__bdrsWasm` API signatures remain the same
- `checkLiveness` gains an optional parameter (must check `len(args)` for backward compat)
- `ValidateSelfie` output gains new `signals.spoof_signals` field but existing consumers ignore unknown keys
- JS fallback path (when WASM unavailable) unchanged
- All existing 45 Go tests continue to pass; the test suite gains 20+ new tests for multi-model skin, blink detection, and date validation

## Version

Bump to v1.1.0 (minor version — new functionality, backward compatible).
