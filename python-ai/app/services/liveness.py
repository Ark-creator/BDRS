from __future__ import annotations

from app.services.image_quality import issue_for_quality, quality_metrics


def check_liveness(selfie_contents: bytes, filename: str) -> dict:
    metrics = quality_metrics(selfie_contents)
    issues = issue_for_quality(metrics, "selfie")

    capture_risk = metrics.get("capture_risk", {})
    screen_attack_penalty = 0
    if metrics["contrast"] < 18 or metrics["sharpness"] < 30:
        screen_attack_penalty += 15
    if capture_risk.get("screen_capture_risk") == "high":
        screen_attack_penalty += 18
    if metrics.get("glare_ratio", 0) > 0.06:
        screen_attack_penalty += 8
    if metrics.get("shadow_ratio", 0) > 0.20:
        screen_attack_penalty += 8

    score = round(max(0.0, min(98.0, metrics["quality_score"] - screen_attack_penalty)), 2)

    return {
        "engine": "passive-heuristic",
        "filename": filename,
        "score": score,
        "passed": score >= 75,
        "issues": issues,
        "signals": {
            "printed_photo_risk": "medium" if metrics["sharpness"] < 30 else "low",
            "screen_replay_risk": capture_risk.get("screen_capture_risk", "low"),
            "tamper_risk": capture_risk.get("tamper_risk", "low"),
            "quality": metrics,
        },
    }
