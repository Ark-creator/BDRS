from __future__ import annotations

from app.services.image_quality import issue_for_quality, quality_metrics


def check_liveness(selfie_contents: bytes, filename: str) -> dict:
    metrics = quality_metrics(selfie_contents)
    issues = issue_for_quality(metrics, "selfie")

    screen_attack_penalty = 15 if metrics["contrast"] < 18 or metrics["sharpness"] < 30 else 0
    score = round(max(0.0, min(98.0, metrics["quality_score"] - screen_attack_penalty)), 2)

    return {
        "engine": "passive-heuristic",
        "filename": filename,
        "score": score,
        "passed": score >= 75,
        "issues": issues,
        "signals": {
            "printed_photo_risk": "medium" if metrics["sharpness"] < 30 else "low",
            "screen_replay_risk": "medium" if screen_attack_penalty else "low",
            "quality": metrics,
        },
    }
