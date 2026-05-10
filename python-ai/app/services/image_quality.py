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


def load_image(contents: bytes) -> tuple[Image.Image, dict[str, Any]]:
    try:
        image = Image.open(BytesIO(contents))
        image = ImageOps.exif_transpose(image)
    except UnidentifiedImageError as exc:
        raise ValueError("Uploaded file is not a readable image.") from exc

    metadata = {
        "format": (image.format or "unknown").lower(),
        "mode": image.mode,
        "dpi": image.info.get("dpi"),
        "has_exif": bool(image.getexif()),
        "size_bytes": len(contents),
    }

    return image.convert("RGB"), metadata


def open_rgb_image(contents: bytes) -> Image.Image:
    image, _metadata = load_image(contents)
    return image


def average_hash(image: Image.Image, size: int = 8) -> str:
    grayscale = image.convert("L").resize((size, size), Image.Resampling.LANCZOS)
    pixels = np.asarray(grayscale, dtype=np.float32)
    mean = pixels.mean()
    bits = pixels > mean
    return "".join("1" if bit else "0" for bit in bits.flatten())


def difference_hash(image: Image.Image, size: int = 8) -> str:
    grayscale = image.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    pixels = np.asarray(grayscale, dtype=np.float32)
    diff = pixels[:, 1:] > pixels[:, :-1]
    return "".join("1" if bit else "0" for bit in diff.flatten())


def hash_distance(left: str, right: str) -> int:
    return sum(1 for a, b in zip(left, right) if a != b)


def quality_metrics(contents: bytes) -> dict[str, Any]:
    image, metadata = load_image(contents)
    rgb = np.asarray(image, dtype=np.uint8)
    grayscale_uint8 = np.asarray(image.convert("L"), dtype=np.uint8)
    grayscale = grayscale_uint8.astype(np.float32)
    width, height = image.size

    brightness = float(grayscale.mean())
    contrast = float(grayscale.std())
    if cv2 is not None:
        sharpness = float(cv2.Laplacian(grayscale_uint8, cv2.CV_64F).var())
    else:
        sharpness = contrast * 10

    glare_ratio = float((grayscale_uint8 > 240).mean())
    shadow_ratio = float((grayscale_uint8 < 28).mean())
    edge_density, border_edge_ratio = _edge_metrics(grayscale_uint8)
    noise_level = _noise_level(grayscale_uint8)
    blockiness = _blockiness(grayscale_uint8)
    channel_means = rgb.reshape(-1, 3).mean(axis=0)
    color_cast = float(max(channel_means) - min(channel_means))

    resolution_score = min(100.0, (width * height) / (900 * 600) * 100)
    brightness_score = max(0.0, 100.0 - abs(brightness - 128.0) / 128.0 * 100.0)
    contrast_score = min(100.0, contrast / 64.0 * 100.0)
    sharpness_score = min(100.0, sharpness / 350.0 * 100.0)
    edge_score = min(100.0, edge_density * 450.0)
    glare_score = max(0.0, 100.0 - (glare_ratio * 900.0))
    shadow_score = max(0.0, 100.0 - (shadow_ratio * 700.0))
    quality_score = round(
        (resolution_score * 0.24)
        + (brightness_score * 0.16)
        + (contrast_score * 0.16)
        + (sharpness_score * 0.22)
        + (edge_score * 0.12)
        + (glare_score * 0.05)
        + (shadow_score * 0.05),
        2,
    )

    screen_capture_score = 0.0
    if metadata["format"] == "png":
        screen_capture_score += 24.0
    if glare_ratio > 0.05:
        screen_capture_score += 26.0
    if noise_level < 5:
        screen_capture_score += 22.0
    if edge_density < 0.02:
        screen_capture_score += 18.0

    tamper_score = 0.0
    if blockiness > 18:
        tamper_score += 30.0
    if edge_density > 0.12 and noise_level < 6:
        tamper_score += 20.0
    if color_cast > 45:
        tamper_score += 15.0

    recapture_score = max(screen_capture_score, tamper_score)

    return {
        "width": width,
        "height": height,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "edge_density": round(edge_density, 4),
        "border_edge_ratio": round(border_edge_ratio, 4),
        "glare_ratio": round(glare_ratio, 4),
        "shadow_ratio": round(shadow_ratio, 4),
        "noise_level": round(noise_level, 2),
        "blockiness": round(blockiness, 2),
        "color_cast": round(color_cast, 2),
        "quality_score": quality_score,
        "sha256": sha256(contents).hexdigest(),
        "average_hash": average_hash(image),
        "difference_hash": difference_hash(image),
        "capture_risk": {
            "screen_capture_score": round(screen_capture_score, 2),
            "tamper_score": round(tamper_score, 2),
            "recapture_score": round(recapture_score, 2),
            "screen_capture_risk": _risk_label(screen_capture_score, 35, 60),
            "tamper_risk": _risk_label(tamper_score, 25, 55),
            "recapture_risk": _risk_label(recapture_score, 35, 65),
        },
        "metadata": metadata,
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
        "center_offset_x": None,
        "center_offset_y": None,
        "touches_edge": None,
        "bounding_box": None,
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
        edge_completeness = _edge_completeness(edges, x, y, box_width, box_height)
        center_offset_x = abs((x + box_width / 2) - (width / 2)) / max(1.0, width)
        center_offset_y = abs((y + box_height / 2) - (height / 2)) / max(1.0, height)
        candidate = {
            "boundary_detected": bool(has_card_shape and area_ratio >= 0.10),
            "boundary_score": round(score, 2),
            "document_area_ratio": round(area_ratio, 3),
            "document_aspect_ratio": round(aspect_ratio, 3),
            "cropped_risk": "medium" if touches_edge else "low",
            "edge_completeness": round(edge_completeness, 3),
            "center_offset_x": round(center_offset_x, 3),
            "center_offset_y": round(center_offset_y, 3),
            "touches_edge": touches_edge,
            "bounding_box": {
                "x": int(x),
                "y": int(y),
                "width": int(box_width),
                "height": int(box_height),
            },
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
    if metrics.get("glare_ratio", 0) > 0.06:
        issues.append(f"{prefix}_glare_detected")
    if metrics.get("shadow_ratio", 0) > 0.20:
        issues.append(f"{prefix}_low_light")
    if metrics.get("edge_density", 0) < 0.015:
        issues.append(f"{prefix}_low_edge_detail")
    if metrics.get("capture_risk", {}).get("screen_capture_risk") == "high":
        issues.append(f"{prefix}_screen_capture_suspected")
    if metrics.get("capture_risk", {}).get("tamper_risk") == "high":
        issues.append(f"{prefix}_tamper_suspected")
    return issues


def _edge_metrics(grayscale_uint8: np.ndarray) -> tuple[float, float]:
    if cv2 is not None:
        edges = cv2.Canny(grayscale_uint8, 50, 160)
    else:
        gradient_x = np.abs(np.diff(grayscale_uint8.astype(np.float32), axis=1))
        gradient_y = np.abs(np.diff(grayscale_uint8.astype(np.float32), axis=0))
        edges = np.zeros_like(grayscale_uint8, dtype=np.float32)
        edges[:, 1:] += gradient_x
        edges[1:, :] += gradient_y
        edges = (edges > 35).astype(np.uint8) * 255

    edge_density = float(edges.mean() / 255.0)
    border = 8
    height, width = edges.shape
    if height <= border * 2 or width <= border * 2:
        return edge_density, edge_density

    border_edges = np.concatenate([
        edges[:border, :].ravel(),
        edges[-border:, :].ravel(),
        edges[:, :border].ravel(),
        edges[:, -border:].ravel(),
    ])
    border_edge_ratio = float(border_edges.mean() / 255.0)
    return edge_density, border_edge_ratio


def _edge_completeness(edges: np.ndarray, x: int, y: int, width: int, height: int) -> float:
    if width <= 0 or height <= 0:
        return 0.0
    thickness = max(2, int(min(width, height) * 0.02))
    x2 = min(edges.shape[1], x + width)
    y2 = min(edges.shape[0], y + height)
    top = edges[y : y + thickness, x:x2]
    bottom = edges[y2 - thickness : y2, x:x2]
    left = edges[y:y2, x : x + thickness]
    right = edges[y:y2, x2 - thickness : x2]
    bands = [top, bottom, left, right]
    totals = [band.mean() / 255.0 if band.size else 0.0 for band in bands]
    return float(sum(totals) / len(totals))


def _noise_level(grayscale_uint8: np.ndarray) -> float:
    if cv2 is not None:
        blurred = cv2.GaussianBlur(grayscale_uint8, (3, 3), 0)
        diff = cv2.absdiff(grayscale_uint8, blurred)
        return float(diff.mean())

    blurred = grayscale_uint8.astype(np.float32)
    blurred = (blurred[:, :-1] + blurred[:, 1:]) / 2
    diff = np.abs(grayscale_uint8[:, 1:].astype(np.float32) - blurred)
    return float(diff.mean())


def _blockiness(grayscale_uint8: np.ndarray) -> float:
    height, width = grayscale_uint8.shape
    if height < 16 or width < 16:
        return 0.0
    vertical = np.abs(
        grayscale_uint8[:, 7::8].astype(np.float32) - grayscale_uint8[:, 8::8].astype(np.float32)
    ).mean()
    horizontal = np.abs(
        grayscale_uint8[7::8, :].astype(np.float32) - grayscale_uint8[8::8, :].astype(np.float32)
    ).mean()
    return float((vertical + horizontal) / 2.0)


def _risk_label(score: float, medium: float, high: float) -> str:
    if score >= high:
        return "high"
    if score >= medium:
        return "medium"
    return "low"
