from __future__ import annotations

from typing import Any

from app.services.face_detection import detect_faces
from app.services.image_quality import document_geometry_metrics, issue_for_quality, quality_metrics
from app.services.liveness import check_liveness

def validate_selfie(contents: bytes, filename: str) -> dict[str, Any]:
    metrics = quality_metrics(contents)
    geometry = document_geometry_metrics(contents)
    liveness = check_liveness(contents, filename)
    faces = detect_faces(contents)
    face_count = len(faces)
    issues = issue_for_quality(metrics, "selfie")
    capture_risk = metrics.get("capture_risk", {})

    if face_count == 0:
        issues.append("selfie_no_face_detected")
    elif face_count > 1:
        issues.append("selfie_multiple_faces_detected")

    if geometry.get("boundary_detected") and geometry.get("document_area_ratio", 0) > 0.2:
        issues.append("selfie_looks_like_id_document")

    if capture_risk.get("screen_capture_risk") in {"medium", "high"}:
        issues.append("selfie_screen_capture_suspected")
    if capture_risk.get("recapture_risk") == "high":
        issues.append("selfie_recapture_suspected")
    if capture_risk.get("tamper_risk") == "high":
        issues.append("selfie_tamper_suspected")

    if liveness["score"] < 65:
        issues.append("selfie_liveness_failed")

    if faces:
        primary_face = max(faces, key=lambda face: face["area_ratio"])
        if primary_face["area_ratio"] < 0.06:
            issues.append("selfie_face_too_small")
        if primary_face["area_ratio"] > 0.72:
            issues.append("selfie_face_too_close")
        if primary_face.get("touches_edge"):
            issues.append("selfie_face_cutoff")
        if primary_face.get("center_offset_x", 0) > 0.25 or primary_face.get("center_offset_y", 0) > 0.25:
            issues.append("selfie_face_off_center")

    critical_issues = {
        "selfie_no_face_detected",
        "selfie_multiple_faces_detected",
        "selfie_looks_like_id_document",
        "selfie_low_resolution",
        "selfie_low_quality",
        "selfie_blurry",
        "selfie_bad_lighting",
        "selfie_low_light",
        "selfie_glare_detected",
        "selfie_liveness_failed",
        "selfie_face_too_small",
        "selfie_face_too_close",
        "selfie_face_cutoff",
        "selfie_face_off_center",
    }
    face_score = 100.0 if face_count == 1 else 0.0
    score = round(
        max(0.0, min(98.0, (metrics["quality_score"] * 0.32) + (face_score * 0.46) + (liveness["score"] * 0.22))),
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
        "capture_risk": capture_risk,
        "document_geometry": geometry,
        "liveness": liveness,
        "issues": sorted(set(issues)),
    }
