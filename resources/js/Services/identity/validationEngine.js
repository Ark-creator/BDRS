import { DOCUMENT_TYPES } from './documentProfiles';
import { cleanLine, clamp, normalizeText } from './textUtils';
import { analyzeImageQuality } from './qualityWorkerClient';
import { detectFaces, analyzeFacePosition } from './faceDetection';
import { runOcr } from './ocrClient';
import { getTesseractBase } from './wasmConfig';

const abortError = () => {
    try {
        return new DOMException('Validation was cancelled.', 'AbortError');
    } catch {
        const error = new Error('Validation was cancelled.');
        error.name = 'AbortError';
        return error;
    }
};

const throwIfAborted = (signal) => {
    if (signal?.aborted) {
        throw abortError();
    }
};

const resolveDocumentType = (selectedType) => {
    const selected = normalizeText(selectedType);
    if (!selected) return null;

    return Object.entries(DOCUMENT_TYPES).find(([, profile]) => (
        profile.dropdown.some((label) => selected.includes(normalizeText(label)))
    ))?.[0] || null;
};

const scoreDocumentType = (rawText, profile) => {
    if (!profile) return 0;
    const normalized = normalizeText(rawText);
    let score = 0;

    for (const keyword of profile.keywords) {
        if (normalized.includes(normalizeText(keyword))) {
            score += keyword.length > 10 ? 24 : 16;
        }
    }

    for (const pattern of profile.patterns) {
        if (pattern.test(rawText)) {
            score += 28;
        }
    }

    return clamp(score, 0, 100);
};

const detectDocumentType = (rawText) => {
    const candidates = Object.entries(DOCUMENT_TYPES)
        .map(([type, profile]) => ({ type, label: profile.label, confidence: scoreDocumentType(rawText, profile) }))
        .sort((a, b) => b.confidence - a.confidence);

    const best = candidates[0];
    return best?.confidence >= 24 ? best : null;
};

const extractFields = (rawText, selectedType) => {
    const profile = DOCUMENT_TYPES[selectedType];
    const lines = rawText.split(/\r?\n/)
        .map(cleanLine)
        .filter((line) => line.length >= 3);
    const normalizedLines = lines.map(normalizeText);
    const ignoredNameWords = [
        'republic',
        'department',
        'transportation',
        'license',
        'identification',
        'passport',
        'address',
        'nationality',
        'birth',
        'expiry',
        'expiration',
        'signature',
        'blood',
        'sex',
        'height',
        'weight',
    ];

    let idNumber = null;
    for (const pattern of profile?.idPatterns || []) {
        const match = rawText.match(pattern);
        if (match) {
            idNumber = (match[1] || match[0]).trim();
            break;
        }
    }

    const birthdateMatch = rawText.match(/\b(?:19|20)\d{2}[/-]\d{1,2}[/-]\d{1,2}\b/)
        || rawText.match(/\b\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}\b/)
        || rawText.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b/i);

    const addressIndex = normalizedLines.findIndex((line) => line.includes('address'));
    const address = addressIndex >= 0
        ? lines.slice(addressIndex + 1, addressIndex + 3).join(' ').trim() || null
        : lines.find((line) => /\b(street|barangay|brgy|city|municipality|province|ave|road|subdivision)\b/i.test(line)) || null;

    const fullName = lines.find((line, index) => {
        const normalized = normalizedLines[index];
        const words = line.split(/\s+/).filter(Boolean);
        if (words.length < 2 || line.length < 7) return false;
        if (/\d/.test(line)) return false;
        if (ignoredNameWords.some((word) => normalized.includes(word))) return false;
        return /[A-Z]{2}/.test(line) || words.length >= 3;
    }) || null;

    return {
        full_name: fullName,
        id_number: idNumber,
        birthdate: birthdateMatch?.[0] || null,
        address,
        id_type: profile?.label || null,
    };
};

const invalidResult = (message, diagnostics, extra = {}) => ({
    status: 'invalid',
    is_valid: false,
    message,
    confidence: diagnostics?.confidence || diagnostics?.quality?.score || 0,
    diagnostics,
    issues: diagnostics?.issues || [],
    ...extra,
});

const validResult = (message, diagnostics, extra = {}) => ({
    status: 'valid',
    is_valid: true,
    message,
    confidence: diagnostics?.confidence || diagnostics?.quality?.score || 100,
    diagnostics,
    issues: diagnostics?.issues || [],
    ...extra,
});

const baseDiagnostics = (qualityReport, role, expectedType) => ({
    mode: 'browser_wasm',
    engine: 'tesseract.js',
    image_role: role,
    document_type: expectedType,
    quality: qualityReport.quality,
    geometry: qualityReport.geometry,
    issues: [...qualityReport.quality.issues, ...qualityReport.quality.blocking_issues],
    tamper_checks: {
        screen_capture_risk: qualityReport.quality.screen_capture_risk,
        recapture_risk: qualityReport.quality.recapture_risk,
        glare_ratio: qualityReport.quality.glare_ratio,
        edge_completeness: qualityReport.quality.edge_completeness,
    },
});

const validateIdImage = async ({ role, file, validIdType, signal }) => {
    const expectedType = resolveDocumentType(validIdType);
    const qualityReport = await analyzeImageQuality({ file, role, signal, maxSide: 1100 });
    throwIfAborted(signal);

    const diagnostics = baseDiagnostics(qualityReport, role, expectedType);

    if (!expectedType) {
        return invalidResult('Please select a supported ID type before capturing the ID.', diagnostics);
    }

    if (qualityReport.quality.blocking_issues.length > 0 || qualityReport.quality.score < 45) {
        return invalidResult(
            role === 'back_id'
                ? 'The back of ID photo is not clear enough. Please retake a brighter, sharper photo.'
                : 'The front of ID photo is not clear enough. Please retake a brighter, sharper photo.',
            diagnostics
        );
    }

    if (!qualityReport.geometry?.boundary_detected) {
        diagnostics.issues.push('id_document_boundary_not_found');
    }

    if (qualityReport.geometry?.cropped_risk && qualityReport.geometry.cropped_risk !== 'low') {
        diagnostics.issues.push('id_possible_crop');
    }

    if (qualityReport.quality.edge_completeness < 0.12) {
        diagnostics.issues.push('id_edge_incomplete');
    }

    if (qualityReport.quality.screen_capture_risk > 0.65) {
        diagnostics.issues.push('id_screenshot_suspected');
    }

    if (qualityReport.quality.recapture_risk > 0.6) {
        diagnostics.issues.push('id_recapture_suspected');
    }

    let ocr;
    try {
        ocr = await runOcr(file, signal);
    } catch (error) {
        if (error.name === 'AbortError') throw error;

        return invalidResult('Browser OCR could not read this ID. Please retake a clearer photo.', {
            ...diagnostics,
            error: error.message,
            issues: [...diagnostics.issues, 'browser_ocr_failed'],
        });
    }

    const ocrText = ocr.text || '';
    const detectedType = detectDocumentType(ocrText);
    const expectedScore = scoreDocumentType(ocrText, DOCUMENT_TYPES[expectedType]);
    const fields = extractFields(ocrText, expectedType);

    diagnostics.ocr = {
        confidence: ocr.confidence,
        text_length: ocrText.trim().length,
        preview: ocrText.replace(/\s+/g, ' ').trim().slice(0, 180),
    };
    diagnostics.detected_document_type = detectedType?.type || null;
    diagnostics.detected_document_label = detectedType?.label || null;
    diagnostics.expected_document_score = expectedScore;
    diagnostics.fields = fields;
    diagnostics.confidence = Math.round((qualityReport.quality.score + ocr.confidence + expectedScore) / 3);

    if (ocrText.trim().length < 18 || ocr.confidence < 22) {
        return invalidResult(
            role === 'back_id'
                ? 'The back of ID text is not readable. Please retake a clearer photo.'
                : 'OCR could not read the ID details. Please retake a closer, clearer photo.',
            {
                ...diagnostics,
                issues: [...diagnostics.issues, 'id_no_readable_text'],
            }
        );
    }

    if (detectedType && detectedType.type !== expectedType && detectedType.confidence >= 35) {
        return invalidResult('Uploaded ID does not match selected ID type.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'id_document_type_mismatch'],
        }, {
            document_type: expectedType,
            detected_document_type: detectedType.type,
            fields,
        });
    }

    if (role === 'front_id' && expectedScore < 24) {
        return invalidResult('Could not confirm that the uploaded ID matches the selected ID type. Please retake the correct ID.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'id_type_not_confirmed'],
        }, {
            document_type: expectedType,
            detected_document_type: detectedType?.type || null,
            fields,
        });
    }

    if (role === 'back_id' && expectedScore < 12 && !/(barcode|qr|serial|magnetic|signature|conditions|restrictions|date issued|issued by)/i.test(ocrText)) {
        return invalidResult('The back of ID does not look readable. Please retake the back side of the selected ID.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'id_back_not_confirmed'],
        }, {
            document_type: expectedType,
            detected_document_type: detectedType?.type || null,
            fields,
        });
    }

    if (diagnostics.issues.some((issue) => issue.startsWith('id_'))) {
        return invalidResult('The ID image needs to be clearer or properly aligned. Please retake the photo.', diagnostics, {
            document_type: expectedType,
            detected_document_type: detectedType?.type || expectedType,
            fields,
        });
    }

    return validResult(
        role === 'back_id' ? 'Back of ID looks valid.' : 'ID looks valid.',
        diagnostics,
        {
            document_type: expectedType,
            detected_document_type: detectedType?.type || expectedType,
            fields,
        }
    );
};

const validateSelfie = async ({ file, signal, captureSignals }) => {
    const qualityReport = await analyzeImageQuality({ file, role: 'selfie', signal, maxSide: 900 });
    throwIfAborted(signal);

    const diagnostics = {
        mode: 'browser_wasm',
        engine: 'browser_face_detector_quality_fallback',
        image_role: 'selfie',
        quality: qualityReport.quality,
        issues: [...qualityReport.quality.issues, ...qualityReport.quality.blocking_issues],
        liveness_checks: {
            texture_score: qualityReport.quality.texture_score,
            screen_capture_risk: qualityReport.quality.screen_capture_risk,
            recapture_risk: qualityReport.quality.recapture_risk,
        },
    };

    if (Number.isFinite(captureSignals?.motion_score)) {
        diagnostics.capture_consistency_score = Math.round(captureSignals.motion_score);
        if (captureSignals.motion_score < 6) {
            diagnostics.issues.push('selfie_motion_too_static');
        }
    }

    if (qualityReport.quality.blocking_issues.length > 0 || qualityReport.quality.score < 45) {
        return invalidResult('The selfie photo is not clear enough. Please retake a brighter, sharper face photo.', diagnostics);
    }

    let faceReport;
    try {
        faceReport = await detectFaces(file);
    } catch (error) {
        faceReport = {
            supported: true,
            face_count: 0,
            error: error.message,
        };
    }

    diagnostics.face_detection = faceReport;

    if (faceReport.supported && faceReport.face_count !== 1) {
        return invalidResult(
            faceReport.face_count > 1
                ? 'More than one face was detected. Please retake a selfie with only your face visible.'
                : 'No face was detected in the selfie. Please retake a clear face photo.',
            {
                ...diagnostics,
                issues: [...diagnostics.issues, faceReport.face_count > 1 ? 'selfie_multiple_faces' : 'selfie_no_face_detected'],
            },
            {
                score: qualityReport.quality.score,
                face_count: faceReport.face_count,
            }
        );
    }

    if (faceReport.supported && faceReport.faces?.length) {
        const largestFace = faceReport.faces.reduce((largest, face) => (
            (face.width * face.height) > (largest.width * largest.height) ? face : largest
        ), faceReport.faces[0]);
        const position = analyzeFacePosition(largestFace, qualityReport.quality.width, qualityReport.quality.height);
        diagnostics.face_position = position;

        if (position.area_ratio < 0.045) {
            diagnostics.issues.push('selfie_face_too_small');
        }
        if (position.area_ratio > 0.68) {
            diagnostics.issues.push('selfie_face_too_close');
        }
        if (!position.centered) {
            diagnostics.issues.push('selfie_face_off_center');
        }
        if (position.touches_edge) {
            diagnostics.issues.push('selfie_partial_face');
        }
    }

    if (qualityReport.quality.screen_capture_risk > 0.6) {
        diagnostics.issues.push('selfie_screen_replay_suspected');
    }

    if (qualityReport.quality.recapture_risk > 0.6) {
        diagnostics.issues.push('selfie_recapture_suspected');
    }

    if (qualityReport.quality.texture_score < 35) {
        diagnostics.issues.push('selfie_liveness_texture_low');
    }

    const faceScore = faceReport.supported && faceReport.face_count === 1 ? 100 : 70;
    const livenessScore = clamp(
        (qualityReport.quality.score * 0.45)
        + (qualityReport.quality.texture_score * 0.35)
        + (faceScore * 0.2)
        - (qualityReport.quality.screen_capture_risk * 30)
        - (qualityReport.quality.recapture_risk * 20),
        0,
        100
    );

    diagnostics.liveness_score = Number(livenessScore.toFixed(2));
    diagnostics.confidence = Math.round((qualityReport.quality.score + livenessScore + faceScore) / 3);

    if (diagnostics.issues.some((issue) => issue.startsWith('selfie_'))) {
        return invalidResult('The selfie needs to be clearer and properly aligned. Please retake the photo.', diagnostics, {
            score: qualityReport.quality.score,
            face_count: faceReport.face_count,
        });
    }

    return validResult('Selfie looks valid.', diagnostics, {
        score: qualityReport.quality.score,
        face_count: faceReport.face_count,
        liveness_score: livenessScore,
    });
};

export const validateRegistrationImageWasm = async ({ role, file, validIdType, signal, captureSignals }) => {
    if (!file) {
        return invalidResult('Please capture an image first.', {
            mode: 'browser_wasm',
            image_role: role,
            issues: ['missing_file'],
        });
    }

    if (role === 'selfie') {
        return validateSelfie({ file, signal, captureSignals });
    }

    return validateIdImage({ role, file, validIdType, signal });
};

export const getWasmIdentityHealth = async () => {
    const base = getTesseractBase();
    const assets = [
        `${base}/worker.min.js`,
        `${base}/core/tesseract-core.wasm.js`,
        `${base}/core/tesseract-core.wasm`,
        `${base}/lang/eng.traineddata.gz`,
    ];

    const checks = await Promise.all(assets.map(async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            return { url, ok: response.ok, status: response.status };
        } catch (error) {
            return { url, ok: false, error: error.message };
        }
    }));

    const missing = checks.filter((check) => !check.ok);

    if (missing.length > 0) {
        return {
            status: 'unavailable',
            message: 'Local WASM OCR assets are missing.',
            diagnostics: {
                mode: 'browser_wasm',
                api_calls: 'disabled',
                missing_assets: missing,
            },
        };
    }

    return {
        status: 'ok',
        message: 'Local browser WASM validator is ready.',
        diagnostics: {
            mode: 'browser_wasm',
            api_calls: 'disabled',
            ocr_engine: 'tesseract.js',
            ocr_assets: checks,
            face_detector: 'FaceDetector' in window ? 'available' : 'not_supported_quality_fallback',
        },
    };
};
