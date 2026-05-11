from __future__ import annotations

from typing import Any

from app.services.face import detect_faces
from app.services.image_quality import issue_for_quality, quality_metrics
from app.services.liveness import check_liveness

ID_TEXT_MARKERS = [
    "republic of the philippines",
    "driver license",
    "drivers license",
    "unified multi purpose id",
    "umid",
    "philippine identification",
    "passport",
    "license no",
    "id no",
    "date of birth",
    "land transportation office",
]


def validate_selfie(contents: bytes, filename: str) -> dict[str, Any]:
    metrics = quality_metrics(contents)
    liveness = check_liveness(contents, filename)
    faces = detect_faces(contents, role="selfie")
    face_count = len(faces)
    issues = issue_for_quality(metrics, "selfie")
    raw_text: list[str] = []

    if face_count == 0:
        issues.append("selfie_no_face_detected")
    elif face_count > 1:
        issues.append("selfie_multiple_faces_detected")

    if _contains_id_text(raw_text):
        issues.append("selfie_contains_id_document_text")

    if liveness["score"] < 65:
        issues.append("selfie_liveness_failed")

    if faces:
        largest_face = max(face["area_ratio"] for face in faces)
        if largest_face < 0.035:
            issues.append("selfie_face_too_small")
        if largest_face > 0.75:
            issues.append("selfie_face_too_close")

    critical_issues = {
        "selfie_no_face_detected",
        "selfie_multiple_faces_detected",
        "selfie_contains_id_document_text",
        "selfie_low_resolution",
        "selfie_low_quality",
        "selfie_blurry",
        "selfie_bad_lighting",
        "selfie_low_dynamic_range",
        "selfie_glare",
        "selfie_heavy_shadow",
        "selfie_liveness_failed",
        "selfie_face_too_small",
        "selfie_face_too_close",
    }
    face_score = 100.0 if face_count == 1 else 0.0
    face_detection_score = max((face["confidence"] for face in faces), default=0.0)
    score = round(
        max(
            0.0,
            min(
                98.0,
                (metrics["quality_score"] * 0.30)
                + (face_score * 0.35)
                + (face_detection_score * 0.15)
                + (liveness["score"] * 0.20),
            ),
        ),
        2,
    )
    passed = score >= 75 and not critical_issues.intersection(issues)

    return {
        "engine": "opencv-haar-passive-liveness",
        "filename": filename,
        "status": "passed" if passed else "failed",
        "passed": passed,
        "score": score,
        "face_count": face_count,
        "faces": faces,
        "quality": metrics,
        "liveness": liveness,
        "raw_text": raw_text,
        "issues": sorted(set(issues)),
    }


def _contains_id_text(lines: list[str]) -> bool:
    if not lines:
        return False

    normalized = " ".join(lines).lower().replace("'", "")
    return any(marker in normalized for marker in ID_TEXT_MARKERS)
