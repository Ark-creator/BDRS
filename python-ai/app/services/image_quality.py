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
    rgb_uint8 = np.asarray(image, dtype=np.uint8)
    grayscale_uint8 = np.asarray(image.convert("L"), dtype=np.uint8)
    grayscale = grayscale_uint8.astype(np.float32)
    width, height = image.size

    brightness = float(grayscale.mean())
    contrast = float(grayscale.std())
    if cv2 is not None:
        sharpness = float(cv2.Laplacian(grayscale_uint8, cv2.CV_64F).var())
        edges = cv2.Canny(grayscale_uint8, 50, 150)
        edge_density = float(edges.mean() / 255.0)
    else:
        sharpness = contrast * 10
        edge_density = min(1.0, contrast / 64.0)

    max_rgb = rgb_uint8.max(axis=2)
    min_rgb = rgb_uint8.min(axis=2)
    with np.errstate(divide="ignore", invalid="ignore"):
        saturation = np.where(max_rgb == 0, 0, (max_rgb - min_rgb) / max_rgb)

    glare_ratio = float(((grayscale_uint8 > 235) & (saturation < 0.12)).mean())
    low_light_ratio = float((grayscale_uint8 < 40).mean())
    saturation_mean = float(saturation.mean())
    dynamic_range = float(grayscale_uint8.max() - grayscale_uint8.min())
    texture_score = min(100.0, (sharpness / 300.0 * 70.0) + (contrast / 64.0 * 30.0))
    screen_capture_risk = min(
        1.0,
        max(0.0, (edge_density * 1.8) + (glare_ratio * 2.6) - (contrast / 80.0) - (saturation_mean * 0.4)),
    )
    recapture_risk = min(
        1.0,
        max(0.0, (glare_ratio * 2.3) + (low_light_ratio * 1.2) + (edge_density * 1.4) - (sharpness / 500.0)),
    )

    resolution_score = min(100.0, (width * height) / (900 * 600) * 100)
    brightness_score = max(0.0, 100.0 - abs(brightness - 128.0) / 128.0 * 100.0)
    contrast_score = min(100.0, contrast / 64.0 * 100.0)
    sharpness_score = min(100.0, sharpness / 350.0 * 100.0)
    glare_penalty = glare_ratio * 100
    low_light_penalty = low_light_ratio * 80
    quality_score = round(
        max(
            0.0,
            (resolution_score * 0.28)
            + (brightness_score * 0.18)
            + (contrast_score * 0.18)
            + (sharpness_score * 0.26)
            + (texture_score * 0.10)
            - glare_penalty
            - low_light_penalty,
        ),
        2,
    )

    return {
        "width": width,
        "height": height,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "edge_density": round(edge_density, 4),
        "dynamic_range": round(dynamic_range, 2),
        "glare_ratio": round(glare_ratio, 4),
        "low_light_ratio": round(low_light_ratio, 4),
        "saturation_mean": round(saturation_mean, 4),
        "texture_score": round(texture_score, 2),
        "screen_capture_risk": round(screen_capture_risk, 3),
        "recapture_risk": round(recapture_risk, 3),
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
        "edge_completeness": 0.0,
        "edge_touch_ratio": 0.0,
        "cropped_risk": "unknown",
    }

    if cv2 is None or image_area <= 0:
        return empty

    gray = np.asarray(image.convert("L"), dtype=np.uint8)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    edge_pixels = float((edges > 0).sum())
    border = max(2, int(min(width, height) * 0.05))
    border_mask = np.zeros_like(edges, dtype=np.uint8)
    border_mask[:border, :] = 1
    border_mask[-border:, :] = 1
    border_mask[:, :border] = 1
    border_mask[:, -border:] = 1
    border_edges = float(((edges > 0) & (border_mask == 1)).sum())
    edge_completeness = border_edges / edge_pixels if edge_pixels else 0.0
    edge_touch_ratio = border_edges / float(border_mask.sum() or 1)

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
        cropped_risk = "high" if touches_edge or edge_completeness > 0.45 else "medium" if edge_completeness > 0.28 else "low"

        score = min(100.0, (area_ratio * 120.0) + (rectangularity * 35.0) + (20.0 if has_card_shape else 0.0))
        candidate = {
            "boundary_detected": bool(has_card_shape and area_ratio >= 0.10),
            "boundary_score": round(score, 2),
            "document_area_ratio": round(area_ratio, 3),
            "document_aspect_ratio": round(aspect_ratio, 3),
            "edge_completeness": round(edge_completeness, 3),
            "edge_touch_ratio": round(edge_touch_ratio, 3),
            "cropped_risk": cropped_risk,
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
    if metrics.get("glare_ratio", 0) > 0.08:
        issues.append(f"{prefix}_glare")
    if metrics.get("low_light_ratio", 0) > 0.35:
        issues.append(f"{prefix}_low_light")
    if metrics.get("screen_capture_risk", 0) > 0.65:
        issues.append(f"{prefix}_screen_capture_risk")
    if metrics.get("recapture_risk", 0) > 0.6:
        issues.append(f"{prefix}_recapture_risk")
    return issues
