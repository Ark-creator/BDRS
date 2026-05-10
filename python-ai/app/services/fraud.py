from __future__ import annotations

from app.services.image_quality import document_geometry_metrics, issue_for_quality, quality_metrics


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

    fake_probability = 100.0 - ((id_metrics["quality_score"] * 0.70) + (selfie_metrics["quality_score"] * 0.30))
    capture_risk = id_metrics.get("capture_risk", {})
    if capture_risk.get("screen_capture_risk") in {"medium", "high"}:
        issues.append("id_screen_capture_suspected")
        fake_probability += 15
    if capture_risk.get("tamper_risk") == "high":
        issues.append("id_tamper_suspected")
        fake_probability += 18
    if capture_risk.get("recapture_risk") == "high":
        issues.append("id_recapture_suspected")
        fake_probability += 18
    if id_geometry.get("edge_completeness", 1) < 0.35:
        issues.append("id_edges_incomplete")
        fake_probability += 10
    if id_geometry.get("document_area_ratio", 0) < 0.16:
        issues.append("id_document_too_small")
        fake_probability += 8
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
            "id_geometry": id_geometry,
            "selfie": selfie_metrics,
            "hashes": {
                "id_image_hash": id_image_hash,
                "selfie_image_hash": selfie_image_hash,
            },
        },
    }
