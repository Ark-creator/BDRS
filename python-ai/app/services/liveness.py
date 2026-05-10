from __future__ import annotations

from app.services.image_quality import issue_for_quality, quality_metrics


def check_liveness(selfie_contents: bytes, filename: str) -> dict:
    metrics = quality_metrics(selfie_contents)
    issues = issue_for_quality(metrics, "selfie")

    screen_attack_penalty = 0
    if metrics["contrast"] < 18 or metrics["sharpness"] < 30:
        screen_attack_penalty += 15
    if metrics.get("screen_capture_risk", 0) >= 45:
        screen_attack_penalty += 14
    if metrics.get("recapture_risk", 0) >= 45:
        screen_attack_penalty += 12
    if metrics.get("glare_ratio", 0) > 0.05:
        screen_attack_penalty += 8

    score = round(max(0.0, min(98.0, metrics["quality_score"] - screen_attack_penalty)), 2)
    if score < 65:
        issues.append("selfie_liveness_failed")

    return {
        "engine": "passive-forensic-heuristic-v2",
        "filename": filename,
        "score": score,
        "passed": score >= 75,
        "issues": sorted(set(issues)),
        "signals": {
            "printed_photo_risk": "medium" if metrics["sharpness"] < 30 or metrics.get("recapture_risk", 0) >= 45 else "low",
            "screen_replay_risk": "medium" if metrics.get("screen_capture_risk", 0) >= 45 or screen_attack_penalty else "low",
            "screen_capture_risk": metrics.get("screen_capture_risk"),
            "recapture_risk": metrics.get("recapture_risk"),
            "tamper_risk": metrics.get("tamper_risk"),
            "quality": metrics,
        },
    }
