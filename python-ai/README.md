# BDRS Identity AI Service

FastAPI service for the Laravel identity verification queue. The default runtime uses deterministic image-quality and forensic heuristics so the service runs quickly in Dokploy and local Docker. Set `INSTALL_HEAVY_AI=true` at build time to install PaddleOCR, DeepFace, InsightFace, RetinaFace, and PyTorch for production model-backed pipelines.

ID document validation depends on OCR text. Without PaddleOCR installed, `/ocr/extract` returns `id_ocr_engine_unavailable` and keeps the verification out of automatic approval instead of guessing from image quality alone.

Endpoints:

- `POST /ocr/extract`
- `POST /face/compare`
- `POST /liveness/check`
- `POST /selfie/validate`
- `POST /fraud/analyze`
- `GET /health`

`/ocr/extract` accepts `document_type` and `document_side` form fields so registration can validate the front and back of the selected ID independently. `/selfie/validate` checks face count, image quality, passive liveness signals, and rejects images that look like ID documents instead of a live face photo.
