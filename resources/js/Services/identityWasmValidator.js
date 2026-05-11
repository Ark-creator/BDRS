import { createWorker } from 'tesseract.js';
import {
    DOCUMENT_TYPES,
    detectDocumentType,
    extractFields,
    resolveDocumentType,
    scoreDocumentType,
} from '@/IdentityVerification/documentProfiles';
import { assessFaceAlignment, detectFaces } from '@/IdentityVerification/faceAnalysis';
import { assessDocumentAuthenticity, assessPassiveLiveness } from '@/IdentityVerification/livenessChecks';
import { analyzeImageQuality, getValidationWorkerStatus } from '@/IdentityVerification/validationWorkerClient';
import { compactIssues, invalidResult, throwIfAborted, validResult } from '@/IdentityVerification/resultHelpers';

const DEFAULT_WASM_MANIFEST = {
    version: 'v1',
    runtime: 'browser-wasm',
    tesseract_base: '/vendor/tesseract',
    assets: {
        worker: '/vendor/tesseract/worker.min.js',
        core_js: '/vendor/tesseract/core/tesseract-core.wasm.js',
        core_wasm: '/vendor/tesseract/core/tesseract-core.wasm',
        language: '/vendor/tesseract/lang/eng.traineddata.gz',
    },
};

const ACTIVE_MANIFEST_URL = '/wasm/active.json';

let manifestPromise = null;
let ocrWorkerPromise = null;

const getWasmManifest = async () => {
    if (!manifestPromise) {
        manifestPromise = fetch(ACTIVE_MANIFEST_URL, { cache: 'no-store' })
            .then((response) => (response.ok ? response.json() : DEFAULT_WASM_MANIFEST))
            .catch(() => DEFAULT_WASM_MANIFEST)
            .then((manifest) => ({
                ...DEFAULT_WASM_MANIFEST,
                ...manifest,
                assets: {
                    ...DEFAULT_WASM_MANIFEST.assets,
                    ...(manifest?.assets || {}),
                },
            }));
    }

    return manifestPromise;
};

const getOcrWorker = async () => {
    if (!ocrWorkerPromise) {
        ocrWorkerPromise = getWasmManifest()
            .then((manifest) => createWorker('eng', 1, {
                workerPath: manifest.assets.worker,
                corePath: `${manifest.tesseract_base || '/vendor/tesseract'}/core`,
                langPath: `${manifest.tesseract_base || '/vendor/tesseract'}/lang`,
                gzip: true,
                logger: () => {},
            }))
            .then(async (worker) => {
                await worker.setParameters({
                    preserve_interword_spaces: '1',
                    tessedit_pageseg_mode: '6',
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-/:,.#() ',
                });

                return worker;
            })
            .catch((error) => {
                ocrWorkerPromise = null;
                throw error;
            });
    }

    return ocrWorkerPromise;
};

const runOcr = async (file, signal) => {
    throwIfAborted(signal);
    const worker = await getOcrWorker();
    throwIfAborted(signal);

    const result = await worker.recognize(file);
    throwIfAborted(signal);

    const data = result?.data || {};
    return {
        ok: true,
        text: data.text || '',
        confidence: Math.round(data.confidence || 0),
        words: data.words || [],
    };
};

const unsupportedDocumentResult = (role, validIdType, diagnostics) => invalidResult(
    'Please select a supported ID type before capturing the ID.',
    {
        ...diagnostics,
        selected_document_type: validIdType,
        issues: compactIssues(diagnostics?.issues || [], ['id_unsupported_selected_type']),
    }
);

const qualityMessageForId = (role, issues) => {
    if (issues.includes('id_cropped_or_cut_off')) {
        return 'The whole ID is not inside the frame. Retake the photo with all edges visible.';
    }
    if (issues.includes('id_glare_detected')) {
        return 'Strong glare is covering the ID. Tilt the card and retake the photo.';
    }
    if (issues.includes('id_screen_capture_detected')) {
        return 'Screenshots are not accepted. Capture the physical ID directly with the camera.';
    }
    if (issues.includes('id_recaptured_image_detected')) {
        return 'This looks like a re-captured image. Capture the original physical ID directly.';
    }
    if (issues.includes('id_tamper_signals_detected')) {
        return 'This ID image shows possible editing or tampering. Retake the original physical ID.';
    }
    if (issues.includes('image_too_dark')) {
        return 'The ID photo is too dark. Retake it in brighter, even lighting.';
    }
    if (issues.includes('image_blurry')) {
        return 'The ID photo is blurry. Hold the camera steady and retake it.';
    }

    return role === 'back_id'
        ? 'The back of ID photo is not clear enough. Please retake a brighter, sharper photo.'
        : 'The front of ID photo is not clear enough. Please retake a brighter, sharper photo.';
};

const qualityMessageForSelfie = (issues) => {
    if (issues.includes('selfie_partial_face_visibility')) {
        return 'Your full face must be visible. Move back slightly and retake the selfie.';
    }
    if (issues.includes('selfie_multiple_faces_detected') || issues.includes('selfie_multiple_faces')) {
        return 'More than one face was detected. Please retake a selfie with only your face visible.';
    }
    if (issues.includes('selfie_no_face_detected')) {
        return 'No face was detected in the selfie. Please retake a clear face photo.';
    }
    if (issues.includes('selfie_face_too_small')) {
        return 'Move closer so your face is clear in the guide.';
    }
    if (issues.includes('selfie_face_too_close')) {
        return 'Move back slightly so your whole face fits in the guide.';
    }
    if (issues.includes('selfie_screen_capture_risk') || issues.includes('selfie_recapture_risk')) {
        return 'The selfie must be captured live, not from another screen or printed photo.';
    }
    if (issues.includes('image_too_dark')) {
        return 'The selfie is too dark. Retake it in brighter, even lighting.';
    }
    if (issues.includes('image_blurry')) {
        return 'The selfie is blurry. Hold still and retake a sharper face photo.';
    }

    return 'The selfie photo is not clear enough. Please retake a brighter, sharper face photo.';
};

const validateIdImage = async ({ role, file, validIdType, signal }) => {
    const expectedType = resolveDocumentType(validIdType);
    const manifest = await getWasmManifest();
    const qualityReport = await analyzeImageQuality(file, role, signal);
    throwIfAborted(signal);

    const isGalleryUpload = file?.captureMetadata?.source === 'gallery';
    const galleryAnalysis = file?.captureMetadata?.gallery_analysis;

    const adjustedForensics = isGalleryUpload 
        ? { ...qualityReport.forensics, screen_capture_risk: Math.max(0, (qualityReport.forensics?.screen_capture_risk || 50) - 30) }
        : qualityReport.forensics;

    const authenticity = assessDocumentAuthenticity({
        quality: qualityReport.quality,
        geometry: qualityReport.geometry,
        forensics: adjustedForensics,
    });
    
    const filteredBlockingIssues = isGalleryUpload 
        ? qualityReport.quality.blocking_issues.filter(issue => !issue.includes('screen_capture'))
        : qualityReport.quality.blocking_issues;
    
    const baseIssues = compactIssues(
        qualityReport.quality.issues,
        filteredBlockingIssues,
        authenticity.issues
    );
    const diagnostics = {
        mode: 'browser_wasm_v2',
        wasm_version: manifest.version,
        engine: 'tesseract.js+worker-quality-v2',
        image_role: role,
        document_type: expectedType,
        selected_document_type: validIdType,
        is_gallery_upload: isGalleryUpload,
        quality: qualityReport.quality,
        document_geometry: qualityReport.geometry,
        forensics: adjustedForensics,
        authenticity,
        issues: baseIssues,
        gallery_analysis: galleryAnalysis || null,
        boundary: {
            method: 'edge_density_boundary_completion',
            aspect_ratio: qualityReport.quality.aspect_ratio,
            edge_density: qualityReport.quality.edge_density,
            card_like_frame: Boolean(qualityReport.geometry?.boundary_detected),
            edge_completeness: qualityReport.geometry?.edge_completeness ?? null,
        },
        tamper_checks: {
            method: 'client_forensic_heuristic',
            screen_capture_risk: adjustedForensics?.screen_capture_risk,
            recapture_risk: adjustedForensics?.recapture_risk,
            tamper_risk: adjustedForensics?.tamper_risk,
        },
        confidence_components: {
            quality: qualityReport.quality.score,
            authenticity: authenticity.score,
        },
    };

    if (!expectedType) {
        return unsupportedDocumentResult(role, validIdType, diagnostics);
    }

    const adjustedQualityThreshold = isGalleryUpload ? 38 : 44;
    const adjustedAuthenticityThreshold = isGalleryUpload ? 40 : 48;

    if (
        filteredBlockingIssues.length > 0
        || qualityReport.quality.score < adjustedQualityThreshold
        || authenticity.score < adjustedAuthenticityThreshold
    ) {
        if (isGalleryUpload && galleryAnalysis?.isDark) {
            return invalidResult('The ID photo is too dark. Please use a brighter photo.', diagnostics);
        }
        return invalidResult(
            qualityMessageForId(role, diagnostics.issues),
            diagnostics
        );
    }

    let ocr;
    try {
        ocr = await runOcr(file, signal);
    } catch (error) {
        if (error.name === 'AbortError') throw error;

        return invalidResult('Browser OCR could not read this ID. Please retake a clearer photo.', {
            ...diagnostics,
            error: error.message,
            issues: compactIssues(diagnostics.issues, ['browser_ocr_failed']),
        });
    }

    const ocrText = ocr.text || '';
    const detectedType = detectDocumentType(ocrText);
    const expectedScore = scoreDocumentType(ocrText, DOCUMENT_TYPES[expectedType]);
    const fields = extractFields(ocrText, expectedType);
    const ocrReadable = ocrText.trim().length >= 18 && ocr.confidence >= 20;
    const confidence = Math.round(
        (qualityReport.quality.score * 0.30)
        + (authenticity.score * 0.22)
        + (ocr.confidence * 0.26)
        + (expectedScore * 0.22)
    );

    diagnostics.ocr = {
        confidence: ocr.confidence,
        text_length: ocrText.trim().length,
        preview: ocrText.replace(/\s+/g, ' ').trim().slice(0, 180),
    };
    diagnostics.detected_document_type = detectedType?.type || null;
    diagnostics.detected_document_label = detectedType?.label || null;
    diagnostics.expected_document_score = expectedScore;
    diagnostics.fields = fields;
    diagnostics.confidence = confidence;
    diagnostics.confidence_components = {
        ...diagnostics.confidence_components,
        ocr: ocr.confidence,
        expected_document: expectedScore,
    };

    if (!ocrReadable) {
        return invalidResult(
            role === 'back_id'
                ? 'The back of ID text is not readable. Please retake a clearer photo.'
                : 'OCR could not read the ID details. Please retake a closer, clearer photo.',
            {
                ...diagnostics,
                issues: compactIssues(diagnostics.issues, ['id_no_readable_text']),
            }
        );
    }

    if (detectedType && detectedType.type !== expectedType && detectedType.confidence >= 35) {
        return invalidResult('Uploaded ID does not match selected ID type.', {
            ...diagnostics,
            issues: compactIssues(diagnostics.issues, ['id_document_type_mismatch']),
        }, {
            document_type: expectedType,
            detected_document_type: detectedType.type,
            fields,
        });
    }

    if (role === 'front_id' && expectedScore < 24) {
        return invalidResult('Could not confirm that the uploaded ID matches the selected ID type. Please retake the correct ID.', {
            ...diagnostics,
            issues: compactIssues(diagnostics.issues, ['id_type_not_confirmed']),
        }, {
            document_type: expectedType,
            detected_document_type: detectedType?.type || null,
            fields,
        });
    }

    if (role === 'back_id' && expectedScore < 12 && !/(barcode|qr|serial|magnetic|signature|conditions|restrictions|date issued|issued by)/i.test(ocrText)) {
        return invalidResult('The back of ID does not look readable. Please retake the back side of the selected ID.', {
            ...diagnostics,
            issues: compactIssues(diagnostics.issues, ['id_back_not_confirmed']),
        }, {
            document_type: expectedType,
            detected_document_type: detectedType?.type || null,
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

const validateSelfie = async ({ file, signal }) => {
    const manifest = await getWasmManifest();
    const qualityReport = await analyzeImageQuality(file, 'selfie', signal);
    throwIfAborted(signal);

    const isGalleryUpload = file?.captureMetadata?.source === 'gallery';
    const galleryAnalysis = file?.captureMetadata?.gallery_analysis;

    const diagnostics = {
        mode: 'browser_wasm_v2',
        wasm_version: manifest.version,
        engine: 'browser-face-detector+worker-quality-v2',
        image_role: 'selfie',
        is_gallery_upload: isGalleryUpload,
        quality: qualityReport.quality,
        forensics: qualityReport.forensics,
        capture: file?.captureMetadata || null,
        gallery_analysis: galleryAnalysis || null,
        issues: compactIssues(qualityReport.quality.issues, qualityReport.quality.blocking_issues),
    };

    if (qualityReport.quality.blocking_issues.length > 0 || qualityReport.quality.score < 42) {
        return invalidResult(qualityMessageForSelfie(diagnostics.issues), diagnostics);
    }

    if (isGalleryUpload && galleryAnalysis) {
        if (galleryAnalysis.isDark && galleryAnalysis.quality < 50) {
            return invalidResult('The selfie is too dark. Please use a brighter photo or capture with camera.', {
                ...diagnostics,
                issues: compactIssues(diagnostics.issues, ['selfie_too_dark_gallery']),
            });
        }
    }

    let faceReport;
    try {
        faceReport = await detectFaces(file);
    } catch (error) {
        faceReport = {
            supported: true,
            face_count: 0,
            faces: [],
            error: error.message,
        };
    }

    const faceAlignment = assessFaceAlignment(faceReport, qualityReport.quality);
    
    const livenessOptions = {
        quality: qualityReport.quality,
        forensics: qualityReport.forensics,
        faceAlignment,
        captureMetadata: file?.captureMetadata || null,
    };
    
    const liveness = isGalleryUpload 
        ? { ...assessPassiveLiveness(livenessOptions), passed: true, score: Math.max(60, assessPassiveLiveness(livenessOptions).score) }
        : assessPassiveLiveness(livenessOptions);
    
    const issues = compactIssues(diagnostics.issues, faceAlignment.issues, liveness.issues);
    
    const qualityWeight = isGalleryUpload ? 0.45 : 0.38;
    const faceWeight = isGalleryUpload ? 0.35 : 0.34;
    const livenessWeight = isGalleryUpload ? 0.20 : 0.28;
    
    const confidence = Math.round(
        (qualityReport.quality.score * qualityWeight)
        + ((faceReport.supported ? faceAlignment.score : 68) * faceWeight)
        + (liveness.score * livenessWeight)
    );

    diagnostics.face_detection = faceReport;
    diagnostics.face_alignment = faceAlignment;
    diagnostics.liveness = liveness;
    diagnostics.issues = issues;
    diagnostics.confidence = confidence;
    diagnostics.confidence_components = {
        quality: qualityReport.quality.score,
        face_alignment: faceReport.supported ? faceAlignment.score : null,
        liveness: liveness.score,
    };

    if (faceReport.supported && faceReport.face_count !== 1) {
        return invalidResult(
            qualityMessageForSelfie(issues),
            {
                ...diagnostics,
                issues: compactIssues(issues, [faceReport.face_count > 1 ? 'selfie_multiple_faces' : 'selfie_no_face_detected']),
            },
            {
                score: confidence,
                face_count: faceReport.face_count,
            }
        );
    }

    const hardFaceIssues = ['selfie_partial_face_visibility', 'selfie_face_too_small', 'selfie_face_too_close'];
    if (hardFaceIssues.some((issue) => issues.includes(issue))) {
        return invalidResult(qualityMessageForSelfie(issues), diagnostics, {
            score: confidence,
            face_count: faceReport.face_count,
        });
    }

    if (!liveness.passed && liveness.score < 62) {
        return invalidResult(qualityMessageForSelfie(issues), {
            ...diagnostics,
            issues: compactIssues(issues, ['selfie_liveness_failed']),
        }, {
            score: confidence,
            face_count: faceReport.face_count,
        });
    }

    return validResult('Selfie looks valid.', diagnostics, {
        score: confidence,
        face_count: faceReport.face_count,
    });
};

export const validateRegistrationImageWasm = async ({ role, file, validIdType, signal }) => {
    if (!file) {
        return invalidResult('Please capture an image first.', {
            mode: 'browser_wasm_v2',
            image_role: role,
            issues: ['missing_file'],
        });
    }

    if (role === 'selfie') {
        return validateSelfie({ file, signal });
    }

    return validateIdImage({ role, file, validIdType, signal });
};

export const getWasmIdentityHealth = async () => {
    const manifest = await getWasmManifest();
    const assets = [
        manifest.assets.worker,
        manifest.assets.core_js,
        manifest.assets.core_wasm,
        manifest.assets.language,
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
            message: 'Local WASM validation assets are missing.',
            diagnostics: {
                mode: 'browser_wasm_v2',
                wasm_version: manifest.version,
                api_calls: 'disabled',
                missing_assets: missing,
            },
        };
    }

    return {
        status: 'ok',
        message: 'Local browser WASM validator is ready.',
        diagnostics: {
            mode: 'browser_wasm_v2',
            wasm_version: manifest.version,
            api_calls: 'disabled',
            ocr_engine: 'tesseract.js',
            ocr_assets: checks,
            validation_worker: getValidationWorkerStatus(),
            face_detector: 'FaceDetector' in window ? 'available' : 'not_supported_quality_fallback',
        },
    };
};
