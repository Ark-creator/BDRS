# BDRS Identity AI Service

FastAPI service for the Laravel identity verification queue. The default runtime uses deterministic image-quality and forensic heuristics so the service runs quickly in Dokploy and local Docker. Set `INSTALL_HEAVY_AI=true` at build time to install PaddleOCR, DeepFace, InsightFace, RetinaFace, and PyTorch for production model-backed pipelines.

Endpoints:

- `POST /ocr/extract`
- `POST /face/compare`
- `POST /liveness/check`
- `POST /fraud/analyze`
- `GET /health`
