from __future__ import annotations

from typing import Any

from app.services.fraud import analyze_fraud


def analyzeFraud(
    id_image_buffer: bytes,
    selfie_image_buffer: bytes,
    id_image_hash: str | None = None,
    selfie_image_hash: str | None = None,
) -> dict[str, Any]:
    try:
        result = analyze_fraud(id_image_buffer, selfie_image_buffer, id_image_hash, selfie_image_hash)
        return {
            "status": "completed",
            "fake_probability": result["fake_probability"],
            "issues": result["issues"],
            "metadata": result["metadata"],
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": {"code": "FRAUD_ANALYSIS_FAILED", "message": str(exc)},
        }
