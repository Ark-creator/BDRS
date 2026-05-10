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
    fake_probability += id_metrics.get("screen_capture_risk", 0) * 0.16
    fake_probability += id_metrics.get("recapture_risk", 0) * 0.14
    fake_probability += id_metrics.get("tamper_risk", 0) * 0.22
    fake_probability += selfie_metrics.get("screen_capture_risk", 0) * 0.06
    fake_probability += selfie_metrics.get("recapture_risk", 0) * 0.08

    if not id_geometry.get("boundary_detected"):
        issues.append("id_document_boundary_not_found")
        fake_probability += 8
    if id_geometry.get("cropped_risk") == "high":
        issues.append("id_cropped_or_cut_off")
        fake_probability += 15
    elif id_geometry.get("cropped_risk") == "medium":
        issues.append("id_possible_crop")
        fake_probability += 7
    if id_geometry.get("boundary_detected") and id_geometry.get("edge_completeness", 1) < 0.35:
        issues.append("id_edges_incomplete")
        fake_probability += 8

    if id_image_hash and selfie_image_hash and id_image_hash == selfie_image_hash:
        issues.append("duplicate_id_and_selfie_image")
        fake_probability += 25
    if id_metrics["sha256"] == selfie_metrics["sha256"]:
        issues.append("duplicate_uploaded_binary")
        fake_probability += 25

    fake_probability = round(max(0.0, min(100.0, fake_probability)), 2)

    return {
        "engine": "forensic-heuristic-v2",
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
