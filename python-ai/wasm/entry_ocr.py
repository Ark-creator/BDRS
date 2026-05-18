from __future__ import annotations

from typing import Any

from pyodide.ffi import create_proxy, to_js

from app.services.ocr import extract_ocr


def extractOcr(
    image_buffer: bytes,
    document_type: str | None = None,
    document_side: str = "front",
) -> dict[str, Any]:
    try:
        result = extract_ocr(image_buffer, "wasm_upload", document_type, document_side)
        return {
            "status": "completed",
            "confidence": result["confidence"],
            "fields": result["fields"],
            "document_validation": result["document_validation"],
            "raw_text": result["raw_text"][:20],
            "issues": result["issues"],
            "engine": result["engine"],
            "quality": result["quality"],
            "document_geometry": result["document_geometry"],
        }
    except Exception as exc:
        return {
            "status": "failed",
            "error": {"code": "EXTRACTION_FAILED", "message": str(exc)},
        }
