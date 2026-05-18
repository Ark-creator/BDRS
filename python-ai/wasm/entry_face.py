from __future__ import annotations

from typing import Any

from app.services.face import compare_faces, detect_faces


def compareFaces(
    id_image_buffer: bytes,
    selfie_image_buffer: bytes,
    id_filename: str = "id.jpg",
    selfie_filename: str = "selfie.jpg",
) -> dict[str, Any]:
    try:
        result = compare_faces(id_image_buffer, selfie_image_buffer, id_filename, selfie_filename)
        return {
            "status": "completed",
            "similarity": result["similarity"],
            "matched": result["similarity"] >= 82,
            "id_face": result["id_face"],
            "selfie_face": result["selfie_face"],
            "checks": result["checks"],
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": {"code": "FACE_COMPARISON_FAILED", "message": str(exc)},
        }
