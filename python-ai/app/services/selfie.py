from __future__ import annotations

from typing import Any

import numpy as np

from app.services.image_quality import cv2
from app.services.image_quality import document_geometry_metrics
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
    face_alignment = _face_alignment(faces, metrics["width"], metrics["height"])
    document_geometry = document_geometry_metrics(contents)
    face_count = len(faces)
    issues = issue_for_quality(metrics, "selfie") + liveness.get("issues", [])
    raw_text: list[str] = []

    if face_count == 0:
        issues.append("selfie_no_face_detected")
    elif face_count > 1:
        issues.append("selfie_multiple_faces_detected")

    if _contains_id_text(raw_text):
        issues.append("selfie_contains_id_document_text")

    if document_geometry.get("boundary_detected") and document_geometry.get("document_area_ratio", 0) > 0.25 and face_count == 0:
        issues.append("selfie_document_like_image")

    if liveness["score"] < 65:
        issues.append("selfie_liveness_failed")

    issues.extend(face_alignment["issues"])

    critical_issues = {
        "selfie_no_face_detected",
        "selfie_multiple_faces_detected",
        "selfie_contains_id_document_text",
        "selfie_document_like_image",
        "selfie_low_resolution",
        "selfie_low_quality",
        "selfie_blurry",
        "selfie_bad_lighting",
        "selfie_screen_capture_detected",
        "selfie_recaptured_image_detected",
        "selfie_liveness_failed",
        "selfie_face_too_small",
        "selfie_face_too_close",
        "selfie_partial_face_visibility",
    }
    face_score = 100.0 if face_count == 1 else 0.0
    score = round(
        max(
            0.0,
            min(
                98.0,
                (metrics["quality_score"] * 0.30)
                + (face_score * 0.25)
                + (face_alignment["score"] * 0.25)
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
        "face_alignment": face_alignment,
        "quality": metrics,
        "liveness": liveness,
        "document_geometry": document_geometry,
        "raw_text": raw_text,
        "issues": sorted(set(issues)),
    }


def _detect_faces(contents: bytes) -> list[dict[str, Any]]:
    if cv2 is None:
        return []

    image = open_rgb_image(contents)
    width, height = image.size
    gray = np.asarray(image.convert("L"), dtype=np.uint8)
    cascades = [
        cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml"),
        cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml"),
    ]
    detections: list[tuple[int, int, int, int]] = []
    for cascade in cascades:
        if cascade.empty():
            continue
        found = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(50, 50))
        detections.extend((int(x), int(y), int(w), int(h)) for x, y, w, h in found)

    faces: list[dict[str, Any]] = []
    image_area = float(width * height) if width and height else 1.0
    for x, y, face_width, face_height in _dedupe_faces(detections):
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


def _dedupe_faces(detections: list[tuple[int, int, int, int]]) -> list[tuple[int, int, int, int]]:
    kept: list[tuple[int, int, int, int]] = []
    for detection in sorted(detections, key=lambda item: item[2] * item[3], reverse=True):
        x, y, width, height = detection
        if any(_iou(detection, existing) > 0.35 for existing in kept):
            continue
        kept.append((x, y, width, height))
    return kept


def _iou(left: tuple[int, int, int, int], right: tuple[int, int, int, int]) -> float:
    lx, ly, lw, lh = left
    rx, ry, rw, rh = right
    inter_x1 = max(lx, rx)
    inter_y1 = max(ly, ry)
    inter_x2 = min(lx + lw, rx + rw)
    inter_y2 = min(ly + lh, ry + rh)
    inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
    union_area = (lw * lh) + (rw * rh) - inter_area
    return inter_area / max(1.0, float(union_area))


def _face_alignment(faces: list[dict[str, Any]], width: int, height: int) -> dict[str, Any]:
    if not faces:
        return {"score": 0.0, "issues": ["selfie_no_face_detected"], "metrics": {}}

    if len(faces) > 1:
        return {"score": 0.0, "issues": ["selfie_multiple_faces_detected"], "metrics": {}}

    face = faces[0]
    image_area = max(1.0, float(width * height))
    area_ratio = (face["width"] * face["height"]) / image_area
    center_x = (face["x"] + face["width"] / 2) / max(1.0, float(width))
    center_y = (face["y"] + face["height"] / 2) / max(1.0, float(height))
    margins = {
        "left": face["x"] / max(1.0, float(width)),
        "right": (width - face["x"] - face["width"]) / max(1.0, float(width)),
        "top": face["y"] / max(1.0, float(height)),
        "bottom": (height - face["y"] - face["height"]) / max(1.0, float(height)),
    }
    center_offset = ((center_x - 0.5) ** 2 + (center_y - 0.46) ** 2) ** 0.5
    issues: list[str] = []

    if area_ratio < 0.055:
        issues.append("selfie_face_too_small")
    if area_ratio > 0.58:
        issues.append("selfie_face_too_close")
    if min(margins["left"], margins["right"], margins["top"]) < 0.018 or margins["bottom"] < 0.006:
        issues.append("selfie_partial_face_visibility")
    if center_offset > 0.22:
        issues.append("selfie_face_off_center")

    score = 100.0
    score -= max(0.0, 0.10 - area_ratio) * 340
    score -= max(0.0, area_ratio - 0.42) * 160
    score -= center_offset * 150
    if "selfie_partial_face_visibility" in issues:
        score -= 34

    return {
        "score": round(max(0.0, min(100.0, score)), 2),
        "issues": issues,
        "metrics": {
            "face_area_ratio": round(area_ratio, 4),
            "center_x": round(center_x, 3),
            "center_y": round(center_y, 3),
            "center_offset": round(center_offset, 3),
            "margins": {key: round(value, 3) for key, value in margins.items()},
        },
    }


def _contains_id_text(lines: list[str]) -> bool:
    if not lines:
        return False

    normalized = " ".join(lines).lower().replace("'", "")
    return any(marker in normalized for marker in ID_TEXT_MARKERS)
