# Identity WASM v2

## 2.0.0

- Added worker-backed image quality analysis to keep camera and form UI responsive.
- Added document boundary, cropped ID, and edge completeness scoring.
- Added glare, low-light, blur, screenshot, re-capture, and tamper-risk heuristics.
- Added selfie face alignment, partial visibility, multiple-face, and passive liveness consistency checks.
- Kept v1 manifest intact for rollback and moved only `/wasm/active.json` to v2.
