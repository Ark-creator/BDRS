# WASM Migration Notes

## v1 → v2

1. Deploy new assets to `/public/wasm/v2/tesseract`.
2. Update `.env`:
   - `IDENTITY_WASM_VERSION=v2`
3. Redeploy frontend assets (Vite build).
4. Monitor registration flow and rollback by switching `IDENTITY_WASM_VERSION` back to `v1` if needed.

## Rollback

- Set `IDENTITY_WASM_VERSION=v1` and redeploy.
- No changes are required to the stored assets under `/public/wasm/v1`.
