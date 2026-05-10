# Identity Verification Build & Deployment

## Overview
This module combines browser-side WASM validation with optional server-side Python AI checks. The client performs fast prechecks in the registration flow, while Laravel queue jobs call the Python FastAPI service for deeper OCR, face, liveness, and fraud analysis when enabled.

## Build Process
1. Install dependencies:
   - `composer install`
   - `npm install`
2. Build the frontend bundle:
   - `npm run build`
3. (Optional) Run the Python AI service locally:
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r python-ai/requirements.txt`
   - `uvicorn app.main:app --reload --port 8067`

## WASM Compilation
The browser validator uses Tesseract WASM assets plus a dedicated Web Worker for image quality scoring. The worker runs off the main thread to keep the UI smooth.

WASM assets are stored under `/public/wasm/{version}`. The current build uses:
- `public/wasm/v2/tesseract` (copied from `/public/vendor/tesseract`)
- `resources/js/Workers/identityValidatorWorker.js`

## Version Upgrade Process
1. Copy/update assets in a new version directory under `/public/wasm/vX`.
2. Update `resources/js/Services/wasmVersion.js`:
   - `ACTIVE_WASM_VERSION = 'vX'`
3. Rebuild the frontend:
   - `npm run build`
4. Validate the health check in-app or via `getWasmIdentityHealth()`.

## Deployment Steps
- Ensure `/public/wasm/v1` and `/public/wasm/v2` are deployed.
- Keep `/public/vendor/tesseract` intact for rollback.
- Deploy the updated frontend bundle and Laravel backend.
- If `IDENTITY_VERIFICATION_SERVER_PRECHECK_ENABLED=true`, deploy the Python FastAPI service as well.

## Browser Compatibility
- Web Workers and OffscreenCanvas are used for the v2 analyzer (fallbacks are included when not supported).
- Face detection uses the native `FaceDetector` API when available; otherwise, quality-only checks are used.
- Tested for modern Chromium-based browsers and recent mobile Safari/Chrome.
