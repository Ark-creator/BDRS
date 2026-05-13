from __future__ import annotations

from app.services.image_quality import issue_for_quality, quality_metrics


def analyze_fraud(
    id_contents: bytes,
    selfie_contents: bytes,
    id_image_hash: str | None = None,
    selfie_image_hash: str | None = None,
) -> dict:
    id_metrics = quality_metrics(id_contents)
    selfie_metrics = quality_metrics(selfie_contents)
    issues = issue_for_quality(id_metrics, "id") + issue_for_quality(selfie_metrics, "selfie")

    fake_probability = 100.0 - ((id_metrics["quality_score"] * 0.70) + (selfie_metrics["quality_score"] * 0.30))
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
            "hashes": {
                "id_image_hash": id_image_hash,
                "selfie_image_hash": selfie_image_hash,
            },
        },
    }
