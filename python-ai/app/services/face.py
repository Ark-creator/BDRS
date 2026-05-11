from __future__ import annotations

from hashlib import sha256
from typing import Any

import numpy as np

from app.services.image_quality import cv2, open_rgb_image, quality_metrics

try:
    from deepface import DeepFace
except Exception as exc:  # pragma: no cover - optional advanced AI dependency.
    DeepFace = None
    _deepface_import_error = str(exc)
else:
    _deepface_import_error = None


def compare_faces(id_contents: bytes, selfie_contents: bytes, id_filename: str, selfie_filename: str) -> dict:
    id_metrics = quality_metrics(id_contents)
    selfie_metrics = quality_metrics(selfie_contents)
    id_faces = detect_faces(id_contents, role="id")
    selfie_faces = detect_faces(selfie_contents, role="selfie")
    id_face = _best_face(id_faces)
    selfie_face = _best_face(selfie_faces)
    similarity = 0.0
    engine = "opencv-face-region"
    embedding_issue = None

    if id_face and selfie_face:
        deepface_score, embedding_issue = _deepface_similarity(id_contents, selfie_contents)
        if deepface_score is not None:
            similarity = deepface_score
            engine = "deepface-facenet-opencv"
        else:
            similarity = _descriptor_similarity(id_contents, id_face, selfie_contents, selfie_face)

        quality_floor = min(id_metrics["quality_score"], selfie_metrics["quality_score"])
        face_quality = min(_face_quality_score(id_face, id_metrics), _face_quality_score(selfie_face, selfie_metrics))
        similarity = round((similarity * 0.78) + (quality_floor * 0.12) + (face_quality * 0.10), 2)

    id_image = open_rgb_image(id_contents)
    selfie_image = open_rgb_image(selfie_contents)
    issues = []
    if not id_faces:
        issues.append("id_face_not_detected")
    if not selfie_faces:
        issues.append("selfie_no_face_detected")
    if len(id_faces) > 1:
        issues.append("id_multiple_faces_detected")
    if len(selfie_faces) > 1:
        issues.append("selfie_multiple_faces_detected")
    if id_metrics["sharpness"] < 40 or selfie_metrics["sharpness"] < 40:
        issues.append("face_blurry")
    if embedding_issue:
        issues.append(embedding_issue)

    return {
        "engine": engine,
        "similarity": max(0.0, min(99.0, similarity)),
        "id_face": {
            "filename": id_filename,
            "face_count": len(id_faces),
            "quality_score": id_metrics["quality_score"],
            "faces": id_faces,
            "embedding_hash": sha256(id_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "selfie_face": {
            "filename": selfie_filename,
            "face_count": len(selfie_faces),
            "quality_score": selfie_metrics["quality_score"],
            "faces": selfie_faces,
            "embedding_hash": sha256(selfie_image.resize((32, 32)).tobytes()).hexdigest(),
        },
        "checks": {
            "multiple_faces": len(id_faces) > 1 or len(selfie_faces) > 1,
            "blurry_face": id_metrics["sharpness"] < 40 or selfie_metrics["sharpness"] < 40,
            "face_detected_in_id": bool(id_faces),
            "face_detected_in_selfie": bool(selfie_faces),
            "issues": sorted(set(issues)),
            "deepface_import_error": _deepface_import_error,
        },
    }


def detect_faces(contents: bytes, role: str = "selfie") -> list[dict[str, Any]]:
    if cv2 is None:
        return []

    image = open_rgb_image(contents)
    width, height = image.size
    rgb = np.asarray(image)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    image_area = float(width * height) if width and height else 1.0
    min_side = 36 if role == "id" else 56
    min_area_ratio = 0.006 if role == "id" else 0.025
    candidates: list[dict[str, Any]] = []

    gray_profiles = [
        ("gray", gray),
        ("clahe", cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(gray)),
        ("equalized", cv2.equalizeHist(gray)),
    ]
    cascade_files = [
        ("frontal_default", "haarcascade_frontalface_default.xml"),
        ("frontal_alt2", "haarcascade_frontalface_alt2.xml"),
        ("profile", "haarcascade_profileface.xml"),
    ]

    for cascade_name, cascade_file in cascade_files:
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + cascade_file)
        if cascade.empty():
            continue

        for profile_name, profile_gray in gray_profiles:
            detections = cascade.detectMultiScale(
                profile_gray,
                scaleFactor=1.05 if role == "id" else 1.08,
                minNeighbors=3 if role == "id" else 4,
                minSize=(min_side, min_side),
                flags=cv2.CASCADE_SCALE_IMAGE,
            )
            for x, y, face_width, face_height in detections:
                area_ratio = float(face_width * face_height) / image_area
                if area_ratio < min_area_ratio:
                    continue

                candidates.append(
                    _face_box(
                        int(x),
                        int(y),
                        int(face_width),
                        int(face_height),
                        width,
                        height,
                        cascade_name,
                        profile_name,
                    )
                )

    return _non_max_suppression(candidates)


def _deepface_similarity(id_contents: bytes, selfie_contents: bytes) -> tuple[float | None, str | None]:
    if DeepFace is None or cv2 is None:
        return None, None

    try:
        id_rgb = np.asarray(open_rgb_image(id_contents))
        selfie_rgb = np.asarray(open_rgb_image(selfie_contents))
        result = DeepFace.verify(
            cv2.cvtColor(id_rgb, cv2.COLOR_RGB2BGR),
            cv2.cvtColor(selfie_rgb, cv2.COLOR_RGB2BGR),
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=False,
            align=True,
        )
    except Exception:  # pragma: no cover - depends on optional model runtime.
        return None, "deepface_runtime_failed"

    distance = float(result.get("distance", 1.0))
    threshold = float(result.get("threshold", 0.40)) or 0.40
    score = 100.0 - min(100.0, (distance / max(threshold * 1.75, 0.01)) * 100.0)
    if result.get("verified"):
        score = max(score, 82.0)
    return round(max(0.0, min(99.0, score)), 2), None


def _descriptor_similarity(
    id_contents: bytes,
    id_face: dict[str, Any],
    selfie_contents: bytes,
    selfie_face: dict[str, Any],
) -> float:
    id_descriptor = _face_descriptor(id_contents, id_face)
    selfie_descriptor = _face_descriptor(selfie_contents, selfie_face)
    if id_descriptor is None or selfie_descriptor is None:
        return 0.0

    cosine = float(np.dot(id_descriptor, selfie_descriptor))
    cosine_score = max(0.0, min(100.0, (cosine + 1.0) * 50.0))
    return round(cosine_score, 2)


def _face_descriptor(contents: bytes, face: dict[str, Any]) -> np.ndarray | None:
    if cv2 is None:
        return None

    image = open_rgb_image(contents)
    rgb = np.asarray(image)
    x, y, width, height = _expanded_box(face, rgb.shape[1], rgb.shape[0], padding=0.18)
    crop = rgb[y : y + height, x : x + width]
    if crop.size == 0:
        return None

    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    gray = cv2.resize(gray, (96, 96), interpolation=cv2.INTER_AREA)
    gray = cv2.equalizeHist(gray)

    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    magnitude, angle = cv2.cartToPolar(gx, gy, angleInDegrees=True)
    hog_features: list[float] = []
    cell_size = 16
    for row in range(0, gray.shape[0], cell_size):
        for col in range(0, gray.shape[1], cell_size):
            cell_mag = magnitude[row : row + cell_size, col : col + cell_size]
            cell_ang = angle[row : row + cell_size, col : col + cell_size]
            hist, _ = np.histogram(cell_ang, bins=9, range=(0, 180), weights=cell_mag)
            hog_features.extend(hist.astype(np.float32).tolist())

    lbp = _lbp_histogram(gray)
    intensity_hist = cv2.calcHist([gray], [0], None, [32], [0, 256]).flatten().astype(np.float32)
    descriptor = np.concatenate([
        np.asarray(hog_features, dtype=np.float32),
        lbp,
        intensity_hist,
    ])
    norm = float(np.linalg.norm(descriptor))
    if norm <= 0:
        return None

    return descriptor / norm


def _lbp_histogram(gray: np.ndarray) -> np.ndarray:
    center = gray[1:-1, 1:-1]
    codes = np.zeros(center.shape, dtype=np.uint8)
    offsets = [
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, 1),
        (1, 1),
        (1, 0),
        (1, -1),
        (0, -1),
    ]

    for bit, (dy, dx) in enumerate(offsets):
        neighbor = gray[1 + dy : 1 + dy + center.shape[0], 1 + dx : 1 + dx + center.shape[1]]
        codes |= ((neighbor >= center) << bit).astype(np.uint8)

    hist = np.bincount(codes.ravel(), minlength=256).astype(np.float32)
    hist_sum = float(hist.sum())
    return hist / hist_sum if hist_sum > 0 else hist


def _face_box(
    x: int,
    y: int,
    width: int,
    height: int,
    image_width: int,
    image_height: int,
    cascade: str,
    profile: str,
) -> dict[str, Any]:
    area_ratio = float(width * height) / float(max(1, image_width * image_height))
    center_x = (x + (width / 2.0)) / max(1, image_width)
    center_y = (y + (height / 2.0)) / max(1, image_height)
    centered = 1.0 - min(1.0, abs(center_x - 0.5) + abs(center_y - 0.45))
    confidence = min(100.0, 45.0 + (area_ratio * 260.0) + (centered * 28.0))

    return {
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "area_ratio": round(area_ratio, 4),
        "confidence": round(confidence, 2),
        "detector": cascade,
        "preprocess": profile,
    }


def _non_max_suppression(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    for candidate in sorted(candidates, key=lambda item: item["confidence"], reverse=True):
        if any(_iou(candidate, face) > 0.35 for face in selected):
            continue
        selected.append(candidate)
        if len(selected) >= 4:
            break

    return selected


def _iou(left: dict[str, Any], right: dict[str, Any]) -> float:
    left_x2 = left["x"] + left["width"]
    left_y2 = left["y"] + left["height"]
    right_x2 = right["x"] + right["width"]
    right_y2 = right["y"] + right["height"]
    intersection_width = max(0, min(left_x2, right_x2) - max(left["x"], right["x"]))
    intersection_height = max(0, min(left_y2, right_y2) - max(left["y"], right["y"]))
    intersection = float(intersection_width * intersection_height)
    union = float((left["width"] * left["height"]) + (right["width"] * right["height"]) - intersection)
    return intersection / union if union > 0 else 0.0


def _best_face(faces: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not faces:
        return None
    return max(faces, key=lambda face: face["confidence"])


def _face_quality_score(face: dict[str, Any], metrics: dict[str, Any]) -> float:
    area = face["area_ratio"]
    if area < 0.02:
        area_score = area / 0.02 * 70.0
    elif area > 0.72:
        area_score = max(40.0, 100.0 - ((area - 0.72) * 180.0))
    else:
        area_score = 100.0

    return round((area_score * 0.45) + (metrics["quality_score"] * 0.55), 2)


def _expanded_box(face: dict[str, Any], image_width: int, image_height: int, padding: float) -> tuple[int, int, int, int]:
    x = int(face["x"])
    y = int(face["y"])
    width = int(face["width"])
    height = int(face["height"])
    pad_x = int(width * padding)
    pad_y = int(height * padding)
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(image_width, x + width + pad_x)
    y2 = min(image_height, y + height + pad_y)
    return x1, y1, max(1, x2 - x1), max(1, y2 - y1)
