from __future__ import annotations

from hashlib import sha256
from io import BytesIO
from typing import Any

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

try:
    import cv2
except Exception:  # pragma: no cover - OpenCV is optional in lightweight installs.
    cv2 = None


def open_rgb_image(contents: bytes) -> Image.Image:
    try:
        image = Image.open(BytesIO(contents))
        image = ImageOps.exif_transpose(image)
        return image.convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a readable image.") from exc


def average_hash(image: Image.Image, size: int = 8) -> str:
    grayscale = image.convert("L").resize((size, size), Image.Resampling.LANCZOS)
    pixels = np.asarray(grayscale, dtype=np.float32)
    mean = pixels.mean()
    bits = pixels > mean
    return "".join("1" if bit else "0" for bit in bits.flatten())


def hash_distance(left: str, right: str) -> int:
    return sum(1 for a, b in zip(left, right) if a != b)


def quality_metrics(contents: bytes) -> dict[str, Any]:
    image = open_rgb_image(contents)
    grayscale_uint8 = np.asarray(image.convert("L"), dtype=np.uint8)
    grayscale = grayscale_uint8.astype(np.float32)
    width, height = image.size

    brightness = float(grayscale.mean())
    contrast = float(grayscale.std())
    if cv2 is not None:
        sharpness = float(cv2.Laplacian(grayscale_uint8, cv2.CV_64F).var())
    else:
        sharpness = contrast * 10

    resolution_score = min(100.0, (width * height) / (900 * 600) * 100)
    brightness_score = max(0.0, 100.0 - abs(brightness - 128.0) / 128.0 * 100.0)
    contrast_score = min(100.0, contrast / 64.0 * 100.0)
    sharpness_score = min(100.0, sharpness / 350.0 * 100.0)
    quality_score = round(
        (resolution_score * 0.30)
        + (brightness_score * 0.20)
        + (contrast_score * 0.20)
        + (sharpness_score * 0.30),
        2,
    )

    return {
        "width": width,
        "height": height,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "quality_score": quality_score,
        "sha256": sha256(contents).hexdigest(),
        "average_hash": average_hash(image),
    }


def document_geometry_metrics(contents: bytes) -> dict[str, Any]:
    image = open_rgb_image(contents)
    width, height = image.size
    image_area = float(width * height)

    empty = {
        "boundary_detected": False,
        "boundary_score": 0.0,
        "document_area_ratio": 0.0,
        "document_aspect_ratio": None,
        "cropped_risk": "unknown",
    }

    if cv2 is None or image_area <= 0:
        return empty

    gray = np.asarray(image.convert("L"), dtype=np.uint8)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best: dict[str, Any] | None = None
    for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:12]:
        area = float(cv2.contourArea(contour))
        if area < image_area * 0.08:
            continue

        perimeter = cv2.arcLength(contour, True)
        approximation = cv2.approxPolyDP(contour, 0.03 * perimeter, True)
        x, y, box_width, box_height = cv2.boundingRect(approximation)
        if box_width <= 0 or box_height <= 0:
            continue

        aspect_ratio = box_width / float(box_height)
        rectangularity = area / float(box_width * box_height)
        area_ratio = area / image_area
        looks_like_card = 1.20 <= aspect_ratio <= 2.35 or 0.42 <= aspect_ratio <= 0.85
        has_card_shape = looks_like_card and rectangularity >= 0.45 and len(approximation) <= 8
        touches_edge = x <= 4 or y <= 4 or (x + box_width) >= width - 4 or (y + box_height) >= height - 4

        score = min(100.0, (area_ratio * 120.0) + (rectangularity * 35.0) + (20.0 if has_card_shape else 0.0))
        candidate = {
            "boundary_detected": bool(has_card_shape and area_ratio >= 0.10),
            "boundary_score": round(score, 2),
            "document_area_ratio": round(area_ratio, 3),
            "document_aspect_ratio": round(aspect_ratio, 3),
            "cropped_risk": "medium" if touches_edge else "low",
        }

        if best is None or candidate["boundary_score"] > best["boundary_score"]:
            best = candidate

    return best or empty


def issue_for_quality(metrics: dict[str, Any], prefix: str) -> list[str]:
    issues: list[str] = []
    if metrics["width"] < 400 or metrics["height"] < 250:
        issues.append(f"{prefix}_low_resolution")
    if metrics["quality_score"] < 45:
        issues.append(f"{prefix}_low_quality")
    if metrics["sharpness"] < 40:
        issues.append(f"{prefix}_blurry")
    if metrics["brightness"] < 45 or metrics["brightness"] > 215:
        issues.append(f"{prefix}_bad_lighting")
    return issues
