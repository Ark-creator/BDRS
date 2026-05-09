from __future__ import annotations

from typing import Any

import numpy as np

from app.services.image_quality import cv2
from app.services.image_quality import issue_for_quality, open_rgb_image, quality_metrics
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
    faces = _detect_faces(contents)
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
        if largest_face < 0.04:
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
        "selfie_liveness_failed",
        "selfie_face_too_small",
        "selfie_face_too_close",
    }
    face_score = 100.0 if face_count == 1 else 0.0
    score = round(
        max(0.0, min(98.0, (metrics["quality_score"] * 0.35) + (face_score * 0.45) + (liveness["score"] * 0.20))),
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


def _detect_faces(contents: bytes) -> list[dict[str, Any]]:
    if cv2 is None:
        return []

    image = open_rgb_image(contents)
    width, height = image.size
    gray = np.asarray(image.convert("L"), dtype=np.uint8)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    detections = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(50, 50))

    faces: list[dict[str, Any]] = []
    image_area = float(width * height) if width and height else 1.0
    for x, y, face_width, face_height in detections:
        faces.append(
            {
                "x": int(x),
                "y": int(y),
                "width": int(face_width),
                "height": int(face_height),
                "area_ratio": round(float(face_width * face_height) / image_area, 4),
            }
        )

    return faces
def _contains_id_text(lines: list[str]) -> bool:
    if not lines:
        return False

    normalized = " ".join(lines).lower().replace("'", "")
    return any(marker in normalized for marker in ID_TEXT_MARKERS)
