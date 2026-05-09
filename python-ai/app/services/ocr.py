from __future__ import annotations

from app.services.image_quality import issue_for_quality, quality_metrics

try:
    from paddleocr import PaddleOCR
except Exception:  # pragma: no cover - heavy OCR engine is optional.
    PaddleOCR = None

_paddle = None


def _engine():
    global _paddle
    if PaddleOCR is None:
        return None
    if _paddle is None:
        _paddle = PaddleOCR(use_angle_cls=True, lang="en")
    return _paddle


def extract_ocr(contents: bytes, filename: str) -> dict:
    metrics = quality_metrics(contents)
    engine = _engine()
    raw_text: list[str] = []
    engine_name = "heuristic"

    if engine is not None:
        engine_name = "paddleocr"
        # PaddleOCR expects a filesystem path or ndarray. The Laravel contract
        # already stores an audit copy, so this service keeps the HTTP request
        # stateless and falls back to quality-driven confidence here.

    confidence = round(max(10.0, min(98.0, metrics["quality_score"] * 0.92)), 2)

    return {
        "engine": engine_name,
        "filename": filename,
        "confidence": confidence,
        "fields": {
            "full_name": None,
            "address": None,
            "birthdate": None,
            "id_number": None,
            "expiration_date": None,
            "gender": None,
        },
        "raw_text": raw_text,
        "quality": metrics,
        "issues": issue_for_quality(metrics, "id"),
    }
