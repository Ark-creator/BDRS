from __future__ import annotations

from typing import Any

from app.services.liveness import check_liveness


def checkLiveness(
    selfie_buffer: bytes,
    face_box: dict[str, Any] | None = None,
    filename: str = "selfie.jpg",
) -> dict[str, Any]:
    try:
        result = check_liveness(selfie_buffer, filename)
        return {
            "status": "completed",
            "score": result["score"],
            "passed": result["passed"],
            "issues": result["issues"],
            "signals": result["signals"],
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": {"code": "LIVENESS_CHECK_FAILED", "message": str(exc)},
        }
