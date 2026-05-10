# BDRS Identity AI Service

Optional FastAPI service for the Laravel identity verification queue. Registration now uses browser-side WASM validation, so this service is only needed when `IDENTITY_VERIFICATION_SERVER_PRECHECK_ENABLED=true` or when queue jobs need advanced server-side AI checks.

The default runtime uses deterministic image-quality and forensic heuristics. Install PaddleOCR, DeepFace, InsightFace, RetinaFace, and PyTorch manually if you need production model-backed pipelines.

ID document validation depends on OCR text. Without PaddleOCR installed, `/ocr/extract` returns `id_ocr_engine_unavailable` and keeps the verification out of automatic approval instead of guessing from image quality alone.

Endpoints:

- `POST /ocr/extract`
- `POST /face/compare`
- `POST /liveness/check`
- `POST /selfie/validate`
- `POST /fraud/analyze`
- `GET /health`

`/ocr/extract` accepts `document_type` and `document_side` form fields so registration can validate the front and back of the selected ID independently. `/selfie/validate` checks face count, image quality, passive liveness signals, and rejects images that look like ID documents instead of a live face photo.
