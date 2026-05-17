# Proposal: Improve WASM Validator Accuracy

## Summary

Upgrade the Go WASM validator's face detection, liveness detection, and ID field extraction from basic heuristics to multi-signal analysis. The current module detects faces via a single RGB skin-color threshold, checks liveness by comparing sharpness/contrast against a single threshold, and extracts ID fields through simple OCR regex — all trivially bypassed or fragile under real-world conditions. This change adds multi-color-space face detection, multi-signal passive anti-spoofing, an active liveness challenge in the browser JS layer, and proximity-based ID field extraction with date validation.

## Motivation

The WASM validator (`wasm/`) was ported from Python AI services for browser-side image validation. The previous change (`improve-go-wasm-validator`) fixed critical bugs in the port and achieved parity with the Python heuristics. However, the underlying algorithms remain heuristic-only — no ML, no multi-signal fusion, no active liveness. This creates four concrete failure modes:

1. **Face detection false positives/negatives** — A single RGB skin threshold (`r>30, g>18, b>10`) breaks on different ethnicities, warm indoor lighting, and skin-colored backgrounds. Dark-skinned users are disproportionately rejected.

2. **Liveness bypass** — The current check ("is contrast > 10 and sharpness > 5?") is defeated by any good-quality photo displayed on a tablet, phone, or glossy print. A 4K iPad showing a high-resolution selfie passes without issue.

3. **No active liveness** — The system never challenges the user to blink, smile, or turn their head. A printed photo held in front of the camera goes undetected.

4. **Weak ID field extraction** — Field values are extracted by finding an OCR label and grabbing the next N lines. OCR errors, multi-line fields, and inconsistent formatting cause frequent extraction failures.

## Scope

- **Face detection**: Replace single RGB skin model with an ensemble of three color-space models (RGB, YCbCr, HSV) + eye-dark-spot verification filter
- **Passive liveness (WASM)**: Add moiré pattern detection, LBP texture uniformity analysis, histogram banding detection, and edge width profile analysis — fused into a multi-signal spoof confidence score
- **Active liveness (JS)**: Implement blink detection challenge during camera capture using face landmark Eye Aspect Ratio (EAR)
- **ID field extraction**: Add proximity-based field scoring, date validation (expiry, birthdate plausibility), and per-document-type layout expectations
- **All existing 45 tests continue to pass**

## Non-goals

- ML model inference in WASM (TensorFlow Lite / ONNX — separate future change)
- Server-side anti-spoofing model (the Python AI service can optionally add this later)
- DeepFace/FaceNet face comparison changes (already handled server-side)
- PaddleOCR or Tesseract.js changes
- Registration page UI changes (the camera interaction will change, but via existing cameraScanner.js patterns)
- Active liveness beyond blink detection (head turn, smile — deferred)
