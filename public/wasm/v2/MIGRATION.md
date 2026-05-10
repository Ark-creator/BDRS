# v1 to v2 Migration

1. Build the frontend with `npm run build`.
2. Activate the v2 WASM manifest with `npm run build:identity-wasm -- v2`.
3. Deploy `public/wasm/active.json`, `public/wasm/v2/manifest.json`, and the existing `public/vendor/tesseract` assets together.
4. Keep `public/wasm/v1/manifest.json` in place for rollback.

Rollback only requires:

```bash
npm run build:identity-wasm -- v1
```
