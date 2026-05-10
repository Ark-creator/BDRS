from __future__ import annotations

from hashlib import sha256

from app.services.face_analysis import detect_faces, pick_primary_face
from app.services.image_quality import hash_distance, open_rgb_image, quality_metrics


def compare_faces(id_contents: bytes, selfie_contents: bytes, id_filename: str, selfie_filename: str) -> dict:
    id_metrics = quality_metrics(id_contents)
    selfie_metrics = quality_metrics(selfie_contents)

    id_image = open_rgb_image(id_contents)
    selfie_image = open_rgb_image(selfie_contents)
    id_faces = detect_faces(id_contents)
    selfie_faces = detect_faces(selfie_contents)
    primary_id_face = pick_primary_face(id_faces)
    primary_selfie_face = pick_primary_face(selfie_faces)

    id_hash_source = id_metrics["average_hash"]
    selfie_hash_source = selfie_metrics["average_hash"]
    if primary_id_face:
        id_crop = id_image.crop((
            primary_id_face["x"],
            primary_id_face["y"],
            primary_id_face["x"] + primary_id_face["width"],
            primary_id_face["y"] + primary_id_face["height"],
        ))
        id_hash_source = sha256(id_crop.resize((32, 32)).tobytes()).hexdigest()
    if primary_selfie_face:
        selfie_crop = selfie_image.crop((
            primary_selfie_face["x"],
            primary_selfie_face["y"],
            primary_selfie_face["x"] + primary_selfie_face["width"],
            primary_selfie_face["y"] + primary_selfie_face["height"],
        ))
        selfie_hash_source = sha256(selfie_crop.resize((32, 32)).tobytes()).hexdigest()

    distance = hash_distance(id_hash_source, selfie_hash_source)
    similarity = round(max(0.0, 100.0 - (distance / 64.0 * 100.0)), 2)
    quality_floor = min(id_metrics["quality_score"], selfie_metrics["quality_score"])
    alignment_floor = min(
        float(primary_id_face["alignment_score"]) if primary_id_face else 60.0,
        float(primary_selfie_face["alignment_score"]) if primary_selfie_face else 60.0,
    )
    adjusted_similarity = round((similarity * 0.60) + (quality_floor * 0.25) + (alignment_floor * 0.15), 2)

    return {
        "engine": "heuristic-face",
        "similarity": adjusted_similarity,
        "id_face": {
            "filename": id_filename,
            "face_count": len(id_faces),
            "quality_score": id_metrics["quality_score"],
            "alignment_score": float(primary_id_face["alignment_score"]) if primary_id_face else 0.0,
            "position_score": round((1.0 - (primary_id_face["off_center"] if primary_id_face else 1.0)) * 100.0, 2),
            "embedding_hash": id_hash_source,
        },
        "selfie_face": {
            "filename": selfie_filename,
            "face_count": len(selfie_faces),
            "quality_score": selfie_metrics["quality_score"],
            "alignment_score": float(primary_selfie_face["alignment_score"]) if primary_selfie_face else 0.0,
            "position_score": round((1.0 - (primary_selfie_face["off_center"] if primary_selfie_face else 1.0)) * 100.0, 2),
            "embedding_hash": selfie_hash_source,
        },
        "checks": {
            "multiple_faces": len(id_faces) > 1 or len(selfie_faces) > 1,
            "partial_face": (primary_id_face["touches_edge"] if primary_id_face else False)
            or (primary_selfie_face["touches_edge"] if primary_selfie_face else False),
            "off_center": (primary_id_face["off_center"] if primary_id_face else 1) > 0.35
            or (primary_selfie_face["off_center"] if primary_selfie_face else 1) > 0.35,
            "low_alignment": (primary_id_face["alignment_score"] if primary_id_face else 0) < 70
            or (primary_selfie_face["alignment_score"] if primary_selfie_face else 0) < 70,
            "blurry_face": id_metrics["sharpness"] < 40 or selfie_metrics["sharpness"] < 40,
        },
    }
