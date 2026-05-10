from __future__ import annotations

from app.services.image_quality import issue_for_quality, quality_metrics


def check_liveness(selfie_contents: bytes, filename: str) -> dict:
    metrics = quality_metrics(selfie_contents)
    issues = issue_for_quality(metrics, "selfie")

    screen_attack_penalty = (metrics.get("screen_capture_risk", 0) * 40.0) + (metrics.get("recapture_risk", 0) * 30.0)
    screen_attack_penalty += metrics.get("glare_ratio", 0) * 40.0
    texture_score = metrics.get("texture_score", 0)
    score = round(
        max(0.0, min(98.0, (metrics["quality_score"] * 0.60) + (texture_score * 0.40) - screen_attack_penalty)),
        2,
    )

    if texture_score < 35:
        issues.append("selfie_liveness_texture_low")
    if metrics.get("screen_capture_risk", 0) > 0.65:
        issues.append("selfie_screen_replay_risk")
    if metrics.get("recapture_risk", 0) > 0.6:
        issues.append("selfie_recapture_risk")

    return {
        "engine": "passive-heuristic",
        "filename": filename,
        "score": score,
        "passed": score >= 75,
        "issues": issues,
        "signals": {
            "printed_photo_risk": "medium" if metrics["sharpness"] < 30 else "low",
            "screen_replay_risk": "high" if metrics.get("screen_capture_risk", 0) > 0.75 else "medium" if metrics.get("screen_capture_risk", 0) > 0.5 else "low",
            "recapture_risk": "high" if metrics.get("recapture_risk", 0) > 0.75 else "medium" if metrics.get("recapture_risk", 0) > 0.5 else "low",
            "texture_score": texture_score,
            "quality": metrics,
        },
    }
