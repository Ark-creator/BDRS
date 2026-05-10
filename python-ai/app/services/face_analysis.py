from __future__ import annotations

from typing import Any

import numpy as np

from app.services.image_quality import cv2
from app.services.image_quality import open_rgb_image


EYE_CASCADE = None
FACE_CASCADE = None


def _cascade(path: str):
    if cv2 is None:
        return None
    return cv2.CascadeClassifier(path)


def _get_face_cascade():
    global FACE_CASCADE
    if FACE_CASCADE is None and cv2 is not None:
        FACE_CASCADE = _cascade(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    return FACE_CASCADE


def _get_eye_cascade():
    global EYE_CASCADE
    if EYE_CASCADE is None and cv2 is not None:
        EYE_CASCADE = _cascade(cv2.data.haarcascades + "haarcascade_eye.xml")
    return EYE_CASCADE


def detect_faces(contents: bytes) -> list[dict[str, Any]]:
    if cv2 is None:
        return []

    image = open_rgb_image(contents)
    width, height = image.size
    gray = np.asarray(image.convert("L"), dtype=np.uint8)
    cascade = _get_face_cascade()
    if cascade is None:
        return []

    detections = cascade.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4, minSize=(50, 50))
    faces: list[dict[str, Any]] = []
    image_area = float(width * height) if width and height else 1.0

    for x, y, face_width, face_height in detections:
        area_ratio = float(face_width * face_height) / image_area
        center_x = x + (face_width / 2.0)
        center_y = y + (face_height / 2.0)
        offset_x = abs(center_x - (width / 2.0)) / (width / 2.0)
        offset_y = abs(center_y - (height / 2.0)) / (height / 2.0)
        off_center = max(offset_x, offset_y)
        touches_edge = x <= 6 or y <= 6 or (x + face_width) >= width - 6 or (y + face_height) >= height - 6
        eyes = _detect_eyes(gray, x, y, face_width, face_height)
        alignment_score = _alignment_score(eyes, face_width)

        faces.append(
            {
                "x": int(x),
                "y": int(y),
                "width": int(face_width),
                "height": int(face_height),
                "area_ratio": round(area_ratio, 4),
                "off_center": round(off_center, 3),
                "centered": off_center <= 0.32,
                "touches_edge": touches_edge,
                "eye_count": len(eyes),
                "alignment_score": alignment_score,
            }
        )

    return faces


def _detect_eyes(gray: np.ndarray, x: int, y: int, width: int, height: int) -> list[tuple[int, int, int, int]]:
    cascade = _get_eye_cascade()
    if cascade is None:
        return []

    roi = gray[y : y + height, x : x + width]
    detections = cascade.detectMultiScale(roi, scaleFactor=1.1, minNeighbors=5, minSize=(15, 15))
    return [(int(ex), int(ey), int(ew), int(eh)) for ex, ey, ew, eh in detections]


def _alignment_score(eyes: list[tuple[int, int, int, int]], face_width: int) -> float:
    if len(eyes) < 2 or face_width <= 0:
        return 65.0

    eyes = sorted(eyes, key=lambda value: value[0])[:2]
    (x1, y1, _, _), (x2, y2, _, _) = eyes
    vertical_offset = abs(y1 - y2)
    alignment_penalty = min(40.0, (vertical_offset / face_width) * 400.0)
    return round(max(0.0, 100.0 - alignment_penalty), 2)


def pick_primary_face(faces: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not faces:
        return None
    return max(faces, key=lambda face: face.get("area_ratio", 0))
