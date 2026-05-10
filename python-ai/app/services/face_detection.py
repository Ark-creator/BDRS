from __future__ import annotations

from typing import Any

import numpy as np

from app.services.image_quality import cv2, open_rgb_image


def detect_faces(contents: bytes, min_size: int = 50) -> list[dict[str, Any]]:
    if cv2 is None:
        return []

    image = open_rgb_image(contents)
    width, height = image.size
    gray = np.asarray(image.convert("L"), dtype=np.uint8)
    cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    detections = cascade.detectMultiScale(
        gray,
        scaleFactor=1.08,
        minNeighbors=4,
        minSize=(min_size, min_size),
    )

    faces: list[dict[str, Any]] = []
    image_area = float(width * height) if width and height else 1.0
    for x, y, face_width, face_height in detections:
        center_offset_x = abs((x + face_width / 2) - (width / 2)) / max(1.0, width)
        center_offset_y = abs((y + face_height / 2) - (height / 2)) / max(1.0, height)
        touches_edge = x <= 6 or y <= 6 or (x + face_width) >= width - 6 or (y + face_height) >= height - 6
        faces.append(
            {
                "x": int(x),
                "y": int(y),
                "width": int(face_width),
                "height": int(face_height),
                "area_ratio": round(float(face_width * face_height) / image_area, 4),
                "center_offset_x": round(center_offset_x, 3),
                "center_offset_y": round(center_offset_y, 3),
                "touches_edge": touches_edge,
                "aspect_ratio": round(face_width / float(face_height), 3) if face_height else None,
            }
        )

    return faces
