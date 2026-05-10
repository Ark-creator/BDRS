from __future__ import annotations

from hashlib import sha256
from io import BytesIO
from math import isfinite
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
    image_area = max(1, width * height)

    brightness = float(grayscale.mean())
    contrast = float(grayscale.std())
    dynamic_range = int(grayscale_uint8.max() - grayscale_uint8.min())
    low_light_ratio = float(np.mean(grayscale_uint8 <= 34))
    glare_ratio = _glare_ratio(image)

    if cv2 is not None:
        laplacian = cv2.Laplacian(grayscale_uint8, cv2.CV_64F)
        sharpness = float(laplacian.var())
        edges = cv2.Canny(grayscale_uint8, 45, 135)
        edge_density = float(np.count_nonzero(edges) / image_area)
    else:
        sharpness = contrast * 10
        edge_density = min(1.0, contrast / 255.0)

    resolution_score = min(100.0, (width * height) / (900 * 600) * 100)
    brightness_score = max(0.0, 100.0 - abs(brightness - 128.0) / 128.0 * 100.0)
    contrast_score = min(100.0, contrast / 64.0 * 100.0)
    sharpness_score = min(100.0, sharpness / 350.0 * 100.0)
    glare_penalty = min(35.0, glare_ratio * 260.0)
    forensic = forensic_metrics(
        width=width,
        height=height,
        file_size=len(contents),
        brightness=brightness,
        contrast=contrast,
        sharpness=sharpness,
        edge_density=edge_density,
        dynamic_range=dynamic_range,
        glare_ratio=glare_ratio,
    )
    quality_score = round(
        (resolution_score * 0.30)
        + (brightness_score * 0.20)
        + (contrast_score * 0.20)
        + (sharpness_score * 0.30)
        - glare_penalty
        - (forensic["screen_capture_risk"] * 0.08)
        - (forensic["recapture_risk"] * 0.06)
        - (forensic["tamper_risk"] * 0.06),
        2,
    )
    quality_score = max(0.0, min(100.0, quality_score))

    return {
        "width": width,
        "height": height,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "edge_density": round(edge_density, 5),
        "dynamic_range": dynamic_range,
        "low_light_ratio": round(low_light_ratio, 5),
        "glare_ratio": round(glare_ratio, 5),
        "quality_score": quality_score,
        "screen_capture_risk": forensic["screen_capture_risk"],
        "recapture_risk": forensic["recapture_risk"],
        "tamper_risk": forensic["tamper_risk"],
        "sha256": sha256(contents).hexdigest(),
        "average_hash": average_hash(image),
    }


def _glare_ratio(image: Image.Image) -> float:
    rgb = np.asarray(image, dtype=np.uint8)
    max_channel = rgb.max(axis=2).astype(np.float32)
    min_channel = rgb.min(axis=2).astype(np.float32)
    saturation = np.divide(
        max_channel - min_channel,
        np.maximum(max_channel, 1.0),
        out=np.zeros_like(max_channel),
        where=max_channel > 0,
    )
    glare_mask = (max_channel >= 245) & (saturation <= 0.16)
    return float(glare_mask.mean())


def forensic_metrics(
    *,
    width: int,
    height: int,
    file_size: int,
    brightness: float,
    contrast: float,
    sharpness: float,
    edge_density: float,
    dynamic_range: int,
    glare_ratio: float,
) -> dict[str, int]:
    aspect_ratio = width / max(1.0, float(height))
    normalized_ratio = aspect_ratio if aspect_ratio >= 1 else 1 / aspect_ratio
    common_screen_ratios = [16 / 9, 18 / 9, 19.5 / 9, 20 / 9, 4 / 3]

    screen_capture_risk = 0.0
    recapture_risk = 0.0
    tamper_risk = 0.0

    if file_size < 55_000 and width * height >= 650_000:
        screen_capture_risk += 24
    if any(abs(normalized_ratio - ratio) <= 0.035 for ratio in common_screen_ratios):
        screen_capture_risk += 16
    if edge_density < 0.006 and dynamic_range < 90:
        screen_capture_risk += 24
    if contrast < 18 and sharpness < 55:
        screen_capture_risk += 12

    if glare_ratio > 0.035 and sharpness < 100:
        recapture_risk += 32
    if brightness > 210 and contrast < 24:
        recapture_risk += 18
    if edge_density < 0.004 and contrast < 18:
        recapture_risk += 12

    if sharpness > 2_200 and contrast < 22:
        tamper_risk += 26
    if edge_density > 0.16 and contrast < 28:
        tamper_risk += 22
    if dynamic_range < 70 or dynamic_range > 252:
        tamper_risk += 10

    return {
        "screen_capture_risk": int(max(0, min(100, round(screen_capture_risk)))),
        "recapture_risk": int(max(0, min(100, round(recapture_risk)))),
        "tamper_risk": int(max(0, min(100, round(tamper_risk)))),
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
        "edge_completeness": 0.0,
        "margins": None,
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
        margins = {
            "left": x / max(1.0, float(width)),
            "top": y / max(1.0, float(height)),
            "right": (width - (x + box_width)) / max(1.0, float(width)),
            "bottom": (height - (y + box_height)) / max(1.0, float(height)),
        }
        min_margin = min(margins.values())
        fill_ratio = max(box_width / max(1.0, float(width)), box_height / max(1.0, float(height)))
        edge_completeness = _edge_completeness(edges, x, y, box_width, box_height)
        cropped_risk = "high" if min_margin < 0.012 or fill_ratio > 0.97 else "medium" if min_margin < 0.035 or fill_ratio > 0.92 else "low"

        score = min(
            100.0,
            (area_ratio * 100.0)
            + (rectangularity * 28.0)
            + (edge_completeness * 24.0)
            + (18.0 if has_card_shape else 0.0),
        )
        candidate = {
            "boundary_detected": bool(has_card_shape and area_ratio >= 0.10 and edge_completeness >= 0.25),
            "boundary_score": round(score, 2),
            "document_area_ratio": round(area_ratio, 3),
            "document_aspect_ratio": round(aspect_ratio, 3),
            "cropped_risk": cropped_risk,
            "edge_completeness": round(edge_completeness, 3),
            "margins": {key: round(value, 3) for key, value in margins.items()},
        }

        if best is None or candidate["boundary_score"] > best["boundary_score"]:
            best = candidate

    return best or empty


def _edge_completeness(edges: np.ndarray, x: int, y: int, width: int, height: int) -> float:
    if width <= 0 or height <= 0:
        return 0.0

    thickness_x = max(2, int(width * 0.035))
    thickness_y = max(2, int(height * 0.035))
    top = edges[y : y + thickness_y, x : x + width]
    bottom = edges[max(y, y + height - thickness_y) : y + height, x : x + width]
    left = edges[y : y + height, x : x + thickness_x]
    right = edges[y : y + height, max(x, x + width - thickness_x) : x + width]
    densities = [
        float(np.count_nonzero(region) / max(1, region.size))
        for region in [top, right, bottom, left]
    ]

    completeness = [max(0.0, min(1.0, density / 0.015)) for density in densities if isfinite(density)]
    return float(sum(completeness) / max(1, len(completeness)))


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
        issues.append(f"{prefix}_glare_detected")
    elif metrics.get("glare_ratio", 0) > 0.035:
        issues.append(f"{prefix}_light_reflection_detected")
    if metrics.get("low_light_ratio", 0) > 0.42:
        issues.append(f"{prefix}_low_light_detected")
    if metrics.get("screen_capture_risk", 0) >= 70:
        issues.append(f"{prefix}_screen_capture_detected")
    elif metrics.get("screen_capture_risk", 0) >= 45:
        issues.append(f"{prefix}_possible_screenshot")
    if metrics.get("recapture_risk", 0) >= 70:
        issues.append(f"{prefix}_recaptured_image_detected")
    elif metrics.get("recapture_risk", 0) >= 45:
        issues.append(f"{prefix}_possible_recapture")
    if metrics.get("tamper_risk", 0) >= 72:
        issues.append(f"{prefix}_tamper_signals_detected")
    elif metrics.get("tamper_risk", 0) >= 48:
        issues.append(f"{prefix}_possible_tampering")
    return issues
