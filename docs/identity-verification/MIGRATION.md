# Migration Notes: v1 → v2

## Summary
The v2 validator introduces worker-based analysis, stronger fraud heuristics, and a production-grade capture overlay. v1 assets and code remain intact for rollback.

## Steps
1. Ensure `/public/wasm/v2/tesseract` assets are deployed.
2. Update `resources/js/Services/wasmVersion.js` to set `ACTIVE_WASM_VERSION = 'v2'`.
3. Confirm the registration UI imports `identityWasmValidatorV2`.
4. Rebuild the frontend: `npm run build`.

## Rollback
1. Change the registration import back to `resources/js/Services/identityWasmValidator` (v1).
2. Set `ACTIVE_WASM_VERSION = 'v1'` if the v2 module remains in use.
3. Rebuild the frontend and redeploy.
