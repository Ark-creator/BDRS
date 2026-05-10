# Identity Verification Pipeline

## Runtime Layout

- Browser precheck: `resources/js/Services/identityWasmValidator.js`
- Browser validation modules: `resources/js/IdentityVerification/*`
- Active WASM manifest: `public/wasm/active.json`
- Rollback manifests: `public/wasm/v1`, `public/wasm/v2`
- Optional server AI service: `python-ai/app`
- Laravel queued verification: `app/Jobs/IdentityVerification/*`

## Browser Validation

The active registration path uses local Tesseract WASM OCR plus a worker-backed image validation engine. The main UI thread keeps camera rendering responsive while the worker scores:

- ID boundary and edge completeness
- Cropped ID risk
- Blur, low-light, overexposure, glare
- Screenshot and re-capture risk
- Tamper-risk signals
- Face count, face alignment, and partial face visibility
- Passive selfie liveness consistency from camera capture metadata

Only user-facing pass/fail guidance is shown in registration. Diagnostics stay inside returned validation payloads and health checks.

## WASM Versioning

`/wasm/v1` is kept as the rollback manifest. `/wasm/v2` is the production manifest. The frontend reads only `/wasm/active.json`.

Activate a version:

```bash
npm run build:identity-wasm -- v2
```

Rollback:

```bash
npm run build:identity-wasm -- v1
```

The build script validates that every manifest asset exists before replacing `public/wasm/active.json`.

## Build And Deploy

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build:identity-wasm -- v2
npm run build
php artisan config:cache
php artisan route:cache
php artisan queue:restart
```

Deploy `public/vendor/tesseract`, `public/wasm`, and the Vite build output together.

## Optional Python AI Service

Run locally:

```bash
cd python-ai
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8067
```

For model-backed OCR and face matching, install `requirements-ai.txt`. Without those heavy libraries, the service still returns deterministic forensic and quality checks and avoids automatic approval when OCR cannot run.

## Security Notes

- Registration defaults to server precheck when `IDENTITY_VERIFICATION_SERVER_PRECHECK_ENABLED=true`.
- Stored verification files remain private.
- Client validation improves UX but is not a trust boundary.
- Queued AI jobs re-check OCR, face, liveness, and fraud signals before final scoring.

## Browser Compatibility

- Chrome and Edge use Web Workers, OffscreenCanvas, local Tesseract WASM, and the browser `FaceDetector` API when available.
- Firefox and Safari fall back to main-thread image analysis or quality-only face fallback when a browser capability is missing.
- Camera capture requires HTTPS in production.
