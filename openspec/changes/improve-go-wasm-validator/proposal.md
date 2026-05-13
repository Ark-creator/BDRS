# Proposal: Improve Go WASM Validator

## Summary

Fix critical bugs, add test coverage, and optimize the Go WASM validator that was ported from the Python AI services. The current module has 2 critical correctness bugs that cause false-negative rejections during registration, 5 high-severity issues, and a 3.8 MB binary that can be significantly reduced.

## Motivation

The Go WASM validator (`wasm/`) was created to replace Python AI services for browser-side image validation during registration. However, the initial port introduced several correctness regressions:

1. **Every image is flagged as blurry** -- sharpness thresholds from the Python Laplacian-based metric were applied unchanged to Go's gradient-based metric, which produces values 10x smaller. This blocks selfie validation entirely.
2. **Back-of-ID validation is broken** -- `acceptsLowOcr` is hardcoded to `false`, making two code branches unreachable dead code. Valid back IDs with barcode signals get rejected.
3. **Face confidence is underestimated by 25-35 points** -- the confidence formula was not correctly ported, causing the 72-point threshold in the JS consumer to rarely be met.
4. **OCR text normalization corrupts words** -- `1d` replacement lacks word boundaries, turning "bo1d" into "boid".
5. **Zero test coverage** -- no tests exist for any of the 15 exported WASM functions.

Additionally, the 3.8 MB WASM binary can be reduced by ~350 KB with trivial changes (removing `crypto/sha256` and `fmt`), or by ~2-2.5 MB by switching to TinyGo.

## Scope

- Fix all critical and high-severity bugs in the Go WASM module
- Add comprehensive test coverage for core functions
- Reduce WASM binary size through targeted dependency removal
- Improve error resilience in the JS loader and validator integration
- Ensure behavioral parity between the Go WASM path and the JS fallback path

## Non-goals

- Porting DeepFace/Haar cascade face detection (requires ML runtime, not WASM-compatible)
- Porting PaddleOCR (Tesseract.js remains the OCR engine)
- TinyGo migration (separate future change due to `syscall/js` compatibility risk)
- Changing the registration page UI or server-side validation flow
