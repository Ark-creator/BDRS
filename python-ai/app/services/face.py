from __future__ import annotations

from hashlib import sha256

from app.services.face_detection import detect_faces
from app.services.image_quality import hash_distance, open_rgb_image, quality_metrics


def compare_faces(id_contents: bytes, selfie_contents: bytes, id_filename: str, selfie_filename: str) -> dict:
    id_metrics = quality_metrics(id_contents)
    selfie_metrics = quality_metrics(selfie_contents)

    average_distance = hash_distance(id_metrics["average_hash"], selfie_metrics["average_hash"])
    difference_distance = hash_distance(id_metrics["difference_hash"], selfie_metrics["difference_hash"])
    similarity = round(max(0.0, 100.0 - ((average_distance + difference_distance) / 128.0 * 100.0)), 2)
    quality_floor = min(id_metrics["quality_score"], selfie_metrics["quality_score"])
    adjusted_similarity = round((similarity * 0.68) + (quality_floor * 0.32), 2)

    id_faces = detect_faces(id_contents, min_size=40)
    selfie_faces = detect_faces(selfie_contents, min_size=50)
    id_face_count = len(id_faces)
    selfie_face_count = len(selfie_faces)
    issues = []
    if id_face_count == 0:
        issues.append("id_no_face_detected")
    if selfie_face_count == 0:
        issues.append("selfie_no_face_detected")
    if id_face_count > 1:
        issues.append("id_multiple_faces_detected")
    if selfie_face_count > 1:
        issues.append("selfie_multiple_faces_detected")

    id_image = open_rgb_image(id_contents)
    selfie_image = open_rgb_image(selfie_contents)

    return {
        "engine": "heuristic-face",
        "similarity": adjusted_similarity,
        "id_face": {
            "filename": id_filename,
            "face_count": id_face_count,
            "faces": id_faces,
            "quality_score": id_metrics["quality_score"],
            "embedding_hash": sha256(id_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "selfie_face": {
            "filename": selfie_filename,
            "face_count": selfie_face_count,
            "faces": selfie_faces,
            "quality_score": selfie_metrics["quality_score"],
            "embedding_hash": sha256(selfie_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "checks": {
            "multiple_faces": id_face_count > 1 or selfie_face_count > 1,
            "blurry_face": id_metrics["sharpness"] < 40 or selfie_metrics["sharpness"] < 40,
            "face_missing": id_face_count == 0 or selfie_face_count == 0,
            "alignment_risk": any(face.get("center_offset_x", 0) > 0.25 for face in selfie_faces),
            "issues": issues,
        },
    }
