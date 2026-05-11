from __future__ import annotations

import re
from datetime import datetime
from statistics import mean
from typing import Any

import numpy as np

from app.services.image_quality import cv2
from app.services.image_quality import document_geometry_metrics
from app.services.image_quality import issue_for_quality, quality_metrics
from app.services.image_quality import open_rgb_image

try:
    from paddleocr import PaddleOCR
except Exception as exc:  # pragma: no cover - heavy OCR engine is optional.
    PaddleOCR = None
    _paddle_import_error = str(exc)
else:
    _paddle_import_error = None

_paddle = None
_paddle_runtime_error: str | None = None

PH_MARKERS = [
    "republic of the philippines",
    "philippines",
    "philippine",
    "pilipinas",
    "phl",
]

COMMON_ID_MARKERS = [
    "last name",
    "first name",
    "middle name",
    "date of birth",
    "birthdate",
    "dob",
    "sex",
    "gender",
    "nationality",
    "address",
    "signature",
    "expiration",
    "expiry",
    "valid until",
    "issued",
    "id no",
    "id number",
    "identification number",
    "license no",
    "passport no",
    "height",
    "weight",
    "blood type",
]

BACK_ID_MARKERS = [
    "if found",
    "return to",
    "emergency contact",
    "organ donor",
    "restrictions",
    "conditions",
    "barcode",
    "qr",
    "magnetic stripe",
    "signature",
    "terms and conditions",
    "this card",
    "issued by",
]

DOCUMENT_PROFILES: dict[str, dict[str, Any]] = {
    "driver_license": {
        "labels": [
            "driver license",
            "drivers license",
            "driver s license",
            "driver licence",
            "drivers licence",
            "professional driver",
            "non professional driver",
            "non professional drivers license",
            "land transportation office",
            "land transport",
            "lto",
            "license no",
            "licence no",
            "agency code",
            "restrictions",
        ],
        "id_patterns": [
            r"\b[A-Z]\d{2}\s*[- ]\s*\d{2}\s*[- ]\s*\d{5,7}\b",
        ],
    },
    "national_id": {
        "labels": [
            "philippine identification",
            "philippine national id",
            "national id",
            "philsys",
            "philid",
            "pcn",
            "psn",
        ],
        "id_patterns": [
            r"\b\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*\d{4}\b",
        ],
    },
    "umid": {
        "labels": [
            "unified multi purpose id",
            "unified multipurpose id",
            "umid",
            "common reference no",
            "crn",
            "sss",
            "gsis",
            "pag ibig",
            "philhealth",
        ],
        "id_patterns": [
            r"\b\d{4}\s*[- ]\s*\d{7}\s*[- ]\s*\d\b",
            r"\b\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*\d{4}\b",
        ],
    },
    "philhealth_id": {
        "labels": [
            "philhealth",
            "philhealth identification",
            "philhealth insurance",
            "pin",
            "philippine health insurance corporation",
        ],
        "id_patterns": [
            r"\b\d{2}\s*[- ]\s*\d{9}\s*[- ]\s*\d\b",
        ],
    },
    "postal_id": {
        "labels": [
            "postal id",
            "postal identity card",
            "phlpost",
            "philippine postal corporation",
        ],
        "id_patterns": [
            r"\b[A-Z0-9]{3,5}\s*[- ]\s*\d{5,9}\b",
        ],
    },
    "voter_id": {
        "labels": [
            "voter",
            "voter id",
            "commission on elections",
            "comelec",
            "precinct",
        ],
        "id_patterns": [
            r"\b\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*[A-Z0-9]{3,8}\b",
        ],
    },
    "prc_id": {
        "labels": [
            "professional regulation commission",
            "professional identification card",
            "prc",
            "registration no",
            "profession",
        ],
        "id_patterns": [
            r"\b\d{6,8}\b",
        ],
    },
    "passport": {
        "labels": [
            "passport",
            "pasaporte",
            "department of foreign affairs",
            "dfa",
            "passport no",
            "issuing authority",
        ],
        "id_patterns": [
            r"\b[A-Z]{1,2}\d{6,8}[A-Z]?\b",
        ],
    },
    "school_id": {
        "labels": [
            "school id",
            "student id",
            "student number",
            "school year",
            "university",
            "college",
            "institute",
        ],
        "id_patterns": [
            r"\b\d{2,4}\s*[- ]\s*\d{3,8}\b",
        ],
    },
    "government_id": {
        "labels": [
            "government id",
            "tin",
            "senior citizen",
            "barangay id",
            "government service",
            "tax identification",
        ],
        "id_patterns": [
            r"\b\d{2,4}\s*[- ]\s*\d{2,5}\s*[- ]\s*\d{2,8}\b",
        ],
    },
}

DATE_PATTERN = re.compile(
    r"\b("
    r"\d{4}[/-]\d{1,2}[/-]\d{1,2}"
    r"|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}"
    r"|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}"
    r"|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}"
    r")\b",
    re.IGNORECASE,
)


def _engine():
    global _paddle_runtime_error
    global _paddle
    if PaddleOCR is None:
        return None
    if _paddle is None:
        try:
            try:
                _paddle = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            except TypeError:
                _paddle = PaddleOCR(use_angle_cls=True, lang="en")
        except Exception as exc:  # pragma: no cover - depends on optional model runtime.
            _paddle_runtime_error = str(exc)
            return None
    return _paddle


def extract_ocr(
    contents: bytes,
    filename: str,
    expected_document_type: str | None = None,
    document_side: str = "front",
) -> dict:
    metrics = quality_metrics(contents)
    geometry = document_geometry_metrics(contents)
    engine = _engine()
    raw_text: list[str]
    line_confidences: list[float]
    engine_name = "heuristic"
    engine_issue: str | None = None

    if engine is not None:
        engine_name = "paddleocr"
        raw_text, line_confidences, engine_issue, preprocessing_profiles = _extract_text_with_paddle(engine, contents)
    else:
        raw_text = []
        line_confidences = []
        engine_issue = "id_ocr_engine_unavailable"
        preprocessing_profiles = []

    fields = _extract_fields(raw_text)
    validation = _validate_document(raw_text, expected_document_type, engine_issue, document_side)
    confidence = _confidence(metrics, line_confidences, validation, engine_issue)

    issues = issue_for_quality(metrics, "id")
    if not geometry["boundary_detected"] and document_side in {"front", "back"}:
        issues.append("id_document_boundary_not_found")
    if geometry["cropped_risk"] == "medium":
        issues.append("id_possible_crop")
    if engine_issue:
        issues.append(engine_issue)
    issues.extend(validation["issues"])

    return {
        "engine": engine_name,
        "filename": filename,
        "confidence": confidence,
        "fields": fields,
        "document_validation": validation,
        "raw_text": raw_text,
        "quality": metrics,
        "document_geometry": geometry,
        "document_side": document_side,
        "issues": sorted(set(issues)),
        "metadata": {
            "line_confidences": line_confidences,
            "preprocessing_profiles": preprocessing_profiles,
            "paddle_import_error": _paddle_import_error,
            "paddle_runtime_error": _paddle_runtime_error,
        },
    }


def _extract_text_with_paddle(engine: Any, contents: bytes) -> tuple[list[str], list[float], str | None, list[dict[str, Any]]]:
    candidates: list[dict[str, Any]] = []
    runtime_errors: list[str] = []

    for profile_name, image in _preprocess_for_ocr(contents):
        try:
            result = engine.ocr(image, cls=True)
        except Exception as exc:  # pragma: no cover - model/runtime specific.
            runtime_errors.append(f"{profile_name}:{exc}")
            continue

        raw_text, confidences = _flatten_paddle_result(result)
        average_confidence = mean(confidences) if confidences else 0.0
        text_length = sum(len(line) for line in raw_text)
        candidate_score = (
            average_confidence * 0.60
            + min(100.0, text_length / 3.0) * 0.25
            + min(100.0, len(raw_text) * 8.0) * 0.15
        )
        candidates.append(
            {
                "profile": profile_name,
                "lines": raw_text,
                "confidences": confidences,
                "line_count": len(raw_text),
                "average_confidence": round(average_confidence, 2),
                "score": round(candidate_score, 2),
            }
        )

    if not candidates:
        return [], [], "id_ocr_engine_failed" if runtime_errors else "id_no_readable_text", []

    readable_candidates = [candidate for candidate in candidates if candidate["lines"]]
    profiles = [
        {
            "profile": candidate["profile"],
            "line_count": candidate["line_count"],
            "average_confidence": candidate["average_confidence"],
            "score": candidate["score"],
        }
        for candidate in sorted(candidates, key=lambda item: item["score"], reverse=True)
    ]

    if not readable_candidates:
        return [], [], "id_no_readable_text", profiles

    raw_text, confidences = _merge_ocr_candidates(readable_candidates)
    return raw_text, confidences, None, profiles


def _preprocess_for_ocr(contents: bytes) -> list[tuple[str, np.ndarray]]:
    image = open_rgb_image(contents)
    width, height = image.size
    scale = max(1.0, 1500.0 / float(max(width, height)))
    if scale > 1.0:
        image = image.resize((int(width * scale), int(height * scale)))

    rgb = np.asarray(image)
    if cv2 is None:
        return [("rgb_upscaled", rgb)]

    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8)).apply(gray)
    denoised = cv2.fastNlMeansDenoising(clahe, None, 9, 7, 21)
    blurred = cv2.GaussianBlur(bgr, (0, 0), 1.0)
    sharpened = cv2.addWeighted(bgr, 1.65, blurred, -0.65, 0)
    adaptive = cv2.adaptiveThreshold(
        denoised,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        9,
    )
    otsu = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    return [
        ("color_sharpened", sharpened),
        ("contrast_gray", clahe),
        ("denoised_gray", denoised),
        ("adaptive_threshold", adaptive),
        ("otsu_threshold", otsu),
    ]


def _merge_ocr_candidates(candidates: list[dict[str, Any]]) -> tuple[list[str], list[float]]:
    merged_lines: list[str] = []
    merged_confidences: list[float] = []
    seen: set[str] = set()

    for candidate in sorted(candidates, key=lambda item: item["score"], reverse=True):
        confidences = candidate["confidences"]
        for index, line in enumerate(candidate["lines"]):
            key = _line_key(line)
            if not key or key in seen:
                continue

            seen.add(key)
            merged_lines.append(_clean_text(line))
            if index < len(confidences):
                merged_confidences.append(confidences[index])

    return merged_lines, merged_confidences


def _line_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", _normalize(value))


def _flatten_paddle_result(result: Any) -> tuple[list[str], list[float]]:
    lines: list[str] = []
    confidences: list[float] = []

    def visit(node: Any) -> None:
        if isinstance(node, tuple) and len(node) >= 2 and isinstance(node[0], str):
            _append_ocr_line(node[0], node[1])
            return

        if not isinstance(node, list):
            return

        if len(node) >= 2 and isinstance(node[1], tuple) and len(node[1]) >= 2 and isinstance(node[1][0], str):
            _append_ocr_line(node[1][0], node[1][1])
            return

        for child in node:
            visit(child)

    def _append_ocr_line(text: str, confidence: Any) -> None:
        cleaned = _clean_text(text)
        if not cleaned:
            return

        lines.append(cleaned)
        try:
            value = float(confidence)
            confidences.append(value * 100 if value <= 1 else value)
        except (TypeError, ValueError):
            pass

    visit(result)
    return lines, confidences


def _extract_fields(lines: list[str]) -> dict[str, str | None]:
    full_name = _extract_full_name(lines)
    birthdate = _extract_date_near(lines, ["date of birth", "birthdate", "birth date", "dob"]) or _extract_date_near(
        lines,
        ["born"],
    )
    expiration_date = _extract_date_near(lines, ["expiration", "expiry", "valid until", "expires"])

    return {
        "full_name": full_name,
        "address": _extract_address(lines),
        "birthdate": birthdate,
        "id_number": _extract_id_number(lines),
        "expiration_date": expiration_date,
        "gender": _extract_gender(lines),
    }


def _extract_full_name(lines: list[str]) -> str | None:
    for index, line in enumerate(lines):
        if any(marker in _normalize(line) for marker in ["last name", "first name", "full name", "name"]) and index + 1 < len(lines):
            candidate = _clean_text(lines[index + 1])
            if _looks_like_person_name(candidate):
                return candidate

    for line in lines:
        candidate = _clean_text(line)
        if "," in candidate and _looks_like_person_name(candidate):
            return candidate

    candidates = [_clean_text(line) for line in lines if _looks_like_person_name(line)]
    if not candidates:
        return None

    return max(candidates, key=lambda value: (len(value.split()), sum(1 for character in value if character.isalpha())))


def _extract_address(lines: list[str]) -> str | None:
    for index, line in enumerate(lines):
        if "address" not in _normalize(line):
            continue

        fragments: list[str] = []
        value = re.sub(r"(?i)\baddress\b\s*[:#-]?\s*", "", line).strip(" ,-:")
        if value:
            fragments.append(value)

        for next_line in lines[index + 1 : index + 3]:
            normalized = _normalize(next_line)
            if any(marker in normalized for marker in ["license", "passport", "expiration", "date of birth", "blood type"]):
                break
            fragments.append(next_line)

        return _clean_text(" ".join(fragments)) or None

    return None


def _extract_date_near(lines: list[str], keywords: list[str]) -> str | None:
    for index, line in enumerate(lines):
        nearby = " ".join(lines[max(0, index - 1) : index + 3])
        normalized = _normalize(nearby)
        if not any(keyword in normalized for keyword in keywords):
            continue

        match = DATE_PATTERN.search(nearby)
        if match:
            return _to_iso_date(match.group(1))

    return None


def _extract_gender(lines: list[str]) -> str | None:
    text = " ".join(lines)
    match = re.search(r"\b(?:sex|gender)\s*[:#-]?\s*(male|female|m|f)\b", text, re.IGNORECASE)
    if not match:
        return None

    value = match.group(1).upper()
    if value == "MALE":
        return "M"
    if value == "FEMALE":
        return "F"
    return value


def _extract_id_number(lines: list[str]) -> str | None:
    text = " ".join(lines)
    for profile in DOCUMENT_PROFILES.values():
        for pattern in profile["id_patterns"]:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return re.sub(r"\s+", "", match.group(0)).upper()

    for line in lines:
        match = re.search(
            r"\b(?:license|passport|id|identification|student|tin|sss|gsis|philhealth)\s*(?:no|number|#)?\.?\s*[:#-]?\s*([A-Z0-9][A-Z0-9 -]{4,24})",
            line,
            re.IGNORECASE,
        )
        if match:
            return _clean_text(match.group(1)).upper()

    return None


def _validate_document(
    lines: list[str],
    expected_document_type: str | None,
    engine_issue: str | None,
    document_side: str = "front",
) -> dict[str, Any]:
    expected_document_type = expected_document_type or None
    raw_text = " ".join(lines)
    normalized_text = _normalize(raw_text)
    signals: list[str] = []
    issues: list[str] = []

    if not lines:
        if engine_issue in {"id_ocr_engine_unavailable", "id_ocr_engine_failed"}:
            return {
                "status": "not_checked",
                "is_identity_document": None,
                "is_supported_document": None,
                "detected_document_type": None,
                "expected_document_type": expected_document_type,
                "document_side": document_side,
                "matches_expected_type": None,
                "score": 0,
                "signals": [],
                "issues": [engine_issue],
            }

        return {
            "status": "failed",
            "is_identity_document": False,
            "is_supported_document": False,
            "detected_document_type": None,
            "expected_document_type": expected_document_type,
            "document_side": document_side,
            "matches_expected_type": None,
            "score": 0,
            "signals": [],
            "issues": ["id_no_readable_text"],
        }

    ph_signal_count = sum(1 for marker in PH_MARKERS if marker in normalized_text)
    common_signal_count = sum(1 for marker in COMMON_ID_MARKERS if marker in normalized_text)
    back_signal_count = sum(1 for marker in BACK_ID_MARKERS if marker in normalized_text)
    date_signal_count = len(DATE_PATTERN.findall(raw_text))

    if ph_signal_count:
        signals.append("philippines_marker")
    if common_signal_count >= 2:
        signals.append("identity_fields")
    if back_signal_count:
        signals.append("back_side_fields")
    if date_signal_count:
        signals.append("date_fields")

    profile_scores: dict[str, int] = {}
    for document_type, profile in DOCUMENT_PROFILES.items():
        label_hits = [label for label in profile["labels"] if label in normalized_text]
        pattern_hits = [
            pattern for pattern in profile["id_patterns"] if re.search(pattern, raw_text, re.IGNORECASE)
        ]
        profile_scores[document_type] = (len(label_hits) * 25) + (len(pattern_hits) * 20)
        if label_hits:
            signals.extend(f"{document_type}:{label}" for label in label_hits[:3])
        if pattern_hits:
            signals.append(f"{document_type}:id_number_pattern")

    detected_document_type = max(profile_scores, key=profile_scores.get)
    if profile_scores[detected_document_type] < 25:
        detected_document_type = None

    score = min(
        100,
        (ph_signal_count * 15)
        + min(common_signal_count, 5) * 10
        + min(back_signal_count, 3) * 8
        + min(date_signal_count, 2) * 5
        + (profile_scores.get(detected_document_type, 0) if detected_document_type else 0),
    )
    profile_score = profile_scores.get(detected_document_type, 0) if detected_document_type else 0
    has_strong_document_marker = profile_score >= 45 or (
        detected_document_type is not None
        and profile_score >= 25
        and (ph_signal_count >= 1 or common_signal_count >= 1)
    )
    if document_side == "back":
        is_identity_document = (score >= 35 and (
            common_signal_count >= 1
            or back_signal_count >= 1
            or has_strong_document_marker
        )) or back_signal_count >= 2
    else:
        is_identity_document = score >= 40 and (common_signal_count >= 2 or has_strong_document_marker)
    is_supported_document = is_identity_document and detected_document_type is not None

    if document_side == "back" and is_identity_document and detected_document_type is None and expected_document_type:
        expected_profile = DOCUMENT_PROFILES.get(expected_document_type)
        if expected_profile:
            expected_label_hits = [label for label in expected_profile["labels"] if label in normalized_text]
            expected_pattern_hits = [
                pattern for pattern in expected_profile["id_patterns"] if re.search(pattern, raw_text, re.IGNORECASE)
            ]
            if expected_label_hits or expected_pattern_hits:
                detected_document_type = expected_document_type
                is_supported_document = True
            elif back_signal_count >= 1 or common_signal_count >= 1:
                signals.append("back_side_expected_type_assumed")
                detected_document_type = expected_document_type
                is_supported_document = True

    matches_expected_type = None
    if expected_document_type:
        matches_expected_type = _document_type_matches(expected_document_type, detected_document_type)

    if not is_identity_document:
        issues.append("id_not_identity_document")
    elif not is_supported_document:
        issues.append("id_unsupported_document_type")
    elif matches_expected_type is False:
        issues.append("id_document_type_mismatch")

    return {
        "status": "passed" if is_supported_document and matches_expected_type is not False else "failed",
        "is_identity_document": is_identity_document,
        "is_supported_document": is_supported_document,
        "detected_document_type": detected_document_type,
        "expected_document_type": expected_document_type,
        "document_side": document_side,
        "matches_expected_type": matches_expected_type,
        "score": score,
        "signals": sorted(set(signals)),
        "issues": issues,
    }


def _document_type_matches(expected: str, detected: str | None) -> bool:
    if detected is None:
        return False
    return expected == detected


def _confidence(
    metrics: dict[str, Any],
    line_confidences: list[float],
    validation: dict[str, Any],
    engine_issue: str | None,
) -> float:
    if engine_issue == "id_ocr_engine_unavailable":
        return round(max(10.0, min(35.0, metrics["quality_score"] * 0.45)), 2)

    ocr_score = mean(line_confidences) if line_confidences else 20.0
    confidence = (ocr_score * 0.60) + (metrics["quality_score"] * 0.20) + (validation["score"] * 0.20)

    if validation["is_identity_document"] is False:
        confidence = min(confidence, 35.0)
    elif validation["is_supported_document"] is False:
        confidence = min(confidence, 50.0)
    elif validation["matches_expected_type"] is False:
        confidence = min(confidence, 55.0)

    return round(max(10.0, min(98.0, confidence)), 2)


def _normalize(value: str) -> str:
    value = value.lower().replace("'", "")
    value = value.replace("identificati0n", "identification")
    value = value.replace("philipp1ne", "philippine")
    value = value.replace("ph1lippine", "philippine")
    value = value.replace("licen5e", "license")
    value = value.replace("licence", "license")
    value = value.replace("0ffice", "office")
    value = value.replace("dr1ver", "driver")
    value = value.replace("1d", "id")
    value = value.replace("lt0", "lto")
    value = value.replace("0cr", "ocr")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = re.sub(r"\bdriver s license\b", "drivers license", value)
    value = re.sub(r"\bdriver s licence\b", "drivers license", value)
    return re.sub(r"\s+", " ", value).strip()


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _looks_like_person_name(value: str) -> bool:
    normalized = _normalize(value)
    if any(marker in normalized for marker in ["republic", "department", "office", "license", "address", "birth", "valid", "signature"]):
        return False
    alpha_words = [word for word in re.findall(r"[A-Za-z]{2,}", value) if len(word) >= 2]
    if len(alpha_words) < 2:
        return False
    if sum(character.isdigit() for character in value) > 2:
        return False
    return 5 <= len(" ".join(alpha_words)) <= 80


def _to_iso_date(value: str) -> str:
    cleaned = value.replace(".", "").replace(",", "")
    for date_format in [
        "%Y/%m/%d",
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%m/%d/%y",
        "%d/%m/%y",
        "%b %d %Y",
        "%B %d %Y",
        "%d %b %Y",
        "%d %B %Y",
    ]:
        try:
            return datetime.strptime(cleaned, date_format).date().isoformat()
        except ValueError:
            continue

    return value
