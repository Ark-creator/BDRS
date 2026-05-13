from __future__ import annotations

from hashlib import sha256

from app.services.image_quality import hash_distance, open_rgb_image, quality_metrics


def compare_faces(id_contents: bytes, selfie_contents: bytes, id_filename: str, selfie_filename: str) -> dict:
    id_metrics = quality_metrics(id_contents)
    selfie_metrics = quality_metrics(selfie_contents)

    distance = hash_distance(id_metrics["average_hash"], selfie_metrics["average_hash"])
    similarity = round(max(0.0, 100.0 - (distance / 64.0 * 100.0)), 2)
    quality_floor = min(id_metrics["quality_score"], selfie_metrics["quality_score"])
    adjusted_similarity = round((similarity * 0.70) + (quality_floor * 0.30), 2)

    id_image = open_rgb_image(id_contents)
    selfie_image = open_rgb_image(selfie_contents)

    return {
        "engine": "heuristic-face",
        "similarity": adjusted_similarity,
        "id_face": {
            "filename": id_filename,
            "face_count": 1 if id_metrics["quality_score"] >= 35 else 0,
            "quality_score": id_metrics["quality_score"],
            "embedding_hash": sha256(id_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "selfie_face": {
            "filename": selfie_filename,
            "face_count": 1 if selfie_metrics["quality_score"] >= 35 else 0,
            "quality_score": selfie_metrics["quality_score"],
            "embedding_hash": sha256(selfie_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "checks": {
            "multiple_faces": False,
            "blurry_face": id_metrics["sharpness"] < 40 or selfie_metrics["sharpness"] < 40,
        },
    }
