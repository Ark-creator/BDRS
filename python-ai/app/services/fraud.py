from __future__ import annotations

from io import BytesIO

import numpy as np
from PIL import ImageChops

from app.services.image_quality import document_geometry_metrics, issue_for_quality, open_rgb_image, quality_metrics


def analyze_fraud(
    id_contents: bytes,
    selfie_contents: bytes,
    id_image_hash: str | None = None,
    selfie_image_hash: str | None = None,
) -> dict:
    id_metrics = quality_metrics(id_contents)
    selfie_metrics = quality_metrics(selfie_contents)
    id_geometry = document_geometry_metrics(id_contents)
    issues = issue_for_quality(id_metrics, "id") + issue_for_quality(selfie_metrics, "selfie")

    tamper_score = _ela_score(id_contents)
    tamper_risk = min(1.0, max(0.0, tamper_score / 12.0))
    fake_probability = 100.0 - ((id_metrics["quality_score"] * 0.65) + (selfie_metrics["quality_score"] * 0.25))
    fake_probability += (id_metrics.get("screen_capture_risk", 0) * 20.0) + (id_metrics.get("recapture_risk", 0) * 15.0)
    fake_probability += tamper_risk * 25.0

    if tamper_risk > 0.6:
        issues.append("id_tamper_suspected")
    if id_metrics.get("screen_capture_risk", 0) > 0.65:
        issues.append("id_screenshot_suspected")
    if id_metrics.get("recapture_risk", 0) > 0.6:
        issues.append("id_recapture_suspected")
    if id_metrics.get("glare_ratio", 0) > 0.08:
        issues.append("id_glare_detected")
    if id_geometry.get("cropped_risk") in {"medium", "high"}:
        issues.append("id_possible_crop")
    if not id_geometry.get("boundary_detected"):
        issues.append("id_document_boundary_not_found")
    if id_image_hash and selfie_image_hash and id_image_hash == selfie_image_hash:
        issues.append("duplicate_id_and_selfie_image")
        fake_probability += 25
    if id_metrics["sha256"] == selfie_metrics["sha256"]:
        issues.append("duplicate_uploaded_binary")
        fake_probability += 25

    fake_probability = round(max(0.0, min(100.0, fake_probability)), 2)

    return {
        "engine": "forensic-heuristic",
        "fake_probability": fake_probability,
        "issues": sorted(set(issues)),
        "metadata": {
            "id": id_metrics,
            "selfie": selfie_metrics,
            "geometry": id_geometry,
            "tamper_score": round(tamper_score, 2),
            "tamper_risk": round(tamper_risk, 3),
            "hashes": {
                "id_image_hash": id_image_hash,
                "selfie_image_hash": selfie_image_hash,
            },
        },
    }


def _ela_score(contents: bytes) -> float:
    image = open_rgb_image(contents)
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    buffer.seek(0)
    recompressed = open_rgb_image(buffer.read())
    diff = ImageChops.difference(image, recompressed).convert("L")
    diff_array = np.asarray(diff, dtype=np.float32)
    return float(diff_array.mean())
