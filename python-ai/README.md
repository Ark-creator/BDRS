# BDRS Identity AI Service

FastAPI service for Laravel identity verification prechecks and queue jobs. Registration uses browser-side WASM validation for fast UX, and production deployments should keep `IDENTITY_VERIFICATION_SERVER_PRECHECK_ENABLED=true` so uploads are also validated server-side before submission.

The default runtime uses deterministic image-quality, document-geometry, face-position, liveness, and forensic heuristics. Install PaddleOCR, DeepFace, InsightFace, RetinaFace, and PyTorch manually if you need production model-backed pipelines.

ID document validation depends on OCR text. Without PaddleOCR installed, `/ocr/extract` returns `id_ocr_engine_unavailable` and keeps the verification out of automatic approval instead of guessing from image quality alone.

Endpoints:

- `POST /ocr/extract`
- `POST /face/compare`
- `POST /liveness/check`
- `POST /selfie/validate`
- `POST /fraud/analyze`
- `GET /health`

`/ocr/extract` accepts `document_type` and `document_side` form fields so registration can validate the front and back of the selected ID independently. `/selfie/validate` checks face count, alignment, image quality, passive liveness signals, and rejects screenshots, re-captures, partial faces, multiple faces, and images that look like ID documents instead of a live face photo.
