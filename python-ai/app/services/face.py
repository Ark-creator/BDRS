from __future__ import annotations

from hashlib import sha256

import numpy as np

from app.services.image_quality import cv2, hash_distance, open_rgb_image, quality_metrics


def compare_faces(id_contents: bytes, selfie_contents: bytes, id_filename: str, selfie_filename: str) -> dict:
    id_metrics = quality_metrics(id_contents)
    selfie_metrics = quality_metrics(selfie_contents)
    id_faces = _detect_face_regions(id_contents)
    selfie_faces = _detect_face_regions(selfie_contents)

    distance = hash_distance(id_metrics["average_hash"], selfie_metrics["average_hash"])
    similarity = max(0.0, 100.0 - (distance / 64.0 * 100.0))
    if id_faces and selfie_faces:
        similarity = max(similarity, _histogram_similarity(id_faces[0]["crop"], selfie_faces[0]["crop"]))
    elif not id_faces or not selfie_faces:
        similarity = min(similarity, 45.0)

    quality_floor = min(id_metrics["quality_score"], selfie_metrics["quality_score"])
    face_penalty = 0.0
    if len(id_faces) != 1:
        face_penalty += 18
    if len(selfie_faces) != 1:
        face_penalty += 22
    adjusted_similarity = round(max(0.0, min(100.0, (similarity * 0.70) + (quality_floor * 0.30) - face_penalty)), 2)

    id_image = open_rgb_image(id_contents)
    selfie_image = open_rgb_image(selfie_contents)

    return {
        "engine": "opencv-haar-face-v2",
        "similarity": adjusted_similarity,
        "id_face": {
            "filename": id_filename,
            "face_count": len(id_faces),
            "quality_score": id_metrics["quality_score"],
            "faces": [_public_face(face) for face in id_faces],
            "embedding_hash": sha256(id_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "selfie_face": {
            "filename": selfie_filename,
            "face_count": len(selfie_faces),
            "quality_score": selfie_metrics["quality_score"],
            "faces": [_public_face(face) for face in selfie_faces],
            "embedding_hash": sha256(selfie_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "checks": {
            "multiple_faces": len(id_faces) > 1 or len(selfie_faces) > 1,
            "blurry_face": id_metrics["sharpness"] < 40 or selfie_metrics["sharpness"] < 40,
            "missing_face": len(id_faces) == 0 or len(selfie_faces) == 0,
        },
    }


def _detect_face_regions(contents: bytes) -> list[dict]:
    if cv2 is None:
        return []

    image = open_rgb_image(contents)
    width, height = image.size
    rgb = np.asarray(image)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    cascades = [
        cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml"),
        cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml"),
    ]
    detections: list[tuple[int, int, int, int]] = []
    for cascade in cascades:
        if cascade.empty():
            continue
        found = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(45, 45))
        detections.extend((int(x), int(y), int(w), int(h)) for x, y, w, h in found)

    faces: list[dict] = []
    image_area = max(1.0, float(width * height))
    for x, y, face_width, face_height in _dedupe_faces(detections):
        crop = rgb[y : y + face_height, x : x + face_width]
        faces.append(
            {
                "x": x,
                "y": y,
                "width": face_width,
                "height": face_height,
                "area_ratio": round((face_width * face_height) / image_area, 4),
                "crop": crop,
            }
        )

    return sorted(faces, key=lambda face: face["area_ratio"], reverse=True)


def _histogram_similarity(left: np.ndarray, right: np.ndarray) -> float:
    left_resized = cv2.resize(left, (96, 96))
    right_resized = cv2.resize(right, (96, 96))
    left_hist = cv2.calcHist([left_resized], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    right_hist = cv2.calcHist([right_resized], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
    cv2.normalize(left_hist, left_hist)
    cv2.normalize(right_hist, right_hist)
    correlation = cv2.compareHist(left_hist, right_hist, cv2.HISTCMP_CORREL)
    return max(0.0, min(100.0, correlation * 100.0))


def _dedupe_faces(detections: list[tuple[int, int, int, int]]) -> list[tuple[int, int, int, int]]:
    kept: list[tuple[int, int, int, int]] = []
    for detection in sorted(detections, key=lambda item: item[2] * item[3], reverse=True):
        if any(_iou(detection, existing) > 0.35 for existing in kept):
            continue
        kept.append(detection)
    return kept


def _iou(left: tuple[int, int, int, int], right: tuple[int, int, int, int]) -> float:
    lx, ly, lw, lh = left
    rx, ry, rw, rh = right
    inter_x1 = max(lx, rx)
    inter_y1 = max(ly, ry)
    inter_x2 = min(lx + lw, rx + rw)
    inter_y2 = min(ly + lh, ry + rh)
    inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
    union_area = (lw * lh) + (rw * rh) - inter_area
    return inter_area / max(1.0, float(union_area))


def _public_face(face: dict) -> dict:
    return {key: value for key, value in face.items() if key != "crop"}
