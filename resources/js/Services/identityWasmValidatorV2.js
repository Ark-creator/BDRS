import { createWorker } from 'tesseract.js';
import { ACTIVE_WASM_VERSION, getWasmBasePath, getWasmManifestPath } from './wasmVersion';

const TESSERACT_BASE = getWasmBasePath(ACTIVE_WASM_VERSION);

const DOCUMENT_TYPES = {
    driver_license: {
        label: "Driver's License",
        dropdown: ["driver's license", 'driver license', 'drivers license'],
        keywords: [
            "driver's license",
            'drivers license',
            'driver license',
            'land transportation office',
            'lto',
            'license no',
            'non-professional',
            'professional driver',
            'restrictions',
        ],
        patterns: [
            /\b[A-Z]\d{2}-\d{2}-\d{6}\b/i,
            /\blicen[cs]e\s*(?:no|number)\b/i,
            /\bland\s+transportation\s+office\b/i,
        ],
        idPatterns: [
            /\b[A-Z]\d{2}-\d{2}-\d{6}\b/i,
            /\blicen[cs]e\s*(?:no|number)?[:\s-]*([A-Z0-9-]{6,})\b/i,
        ],
    },
    national_id: {
        label: 'National ID',
        dropdown: ['national id', 'philippine identification', 'philid', 'ephilid'],
        keywords: [
            'philippine identification',
            'philid',
            'ephilid',
            'philsys',
            'psn',
            'pcn',
            'pambansang pagkakakilanlan',
        ],
        patterns: [
            /\bphil(?:ippine)?\s+identification\b/i,
            /\bphilid\b/i,
            /\bphilsys\b/i,
            /\b(?:psn|pcn)[:\s-]*\d{4}/i,
        ],
        idPatterns: [
            /\b\d{4}-\d{4}-\d{4}-\d{4}\b/,
            /\b(?:psn|pcn)[:\s-]*([0-9-]{8,})\b/i,
        ],
    },
    passport: {
        label: 'Passport',
        dropdown: ['passport'],
        keywords: [
            'passport',
            'pasaporte',
            'department of foreign affairs',
            'dfa',
            'type p',
            'p<phl',
        ],
        patterns: [
            /\bpassport\b/i,
            /\bpasaporte\b/i,
            /\bp<phl/i,
            /\bdepartment\s+of\s+foreign\s+affairs\b/i,
        ],
        idPatterns: [
            /\b[A-Z][0-9]{7}[A-Z]?\b/,
            /\bpassport\s*(?:no|number)?[:\s-]*([A-Z0-9]{7,10})\b/i,
        ],
    },
    umid: {
        label: 'UMID Card',
        dropdown: ['umid', 'umid card', 'unified multi-purpose id'],
        keywords: [
            'umid',
            'unified multi-purpose id',
            'unified multipurpose id',
            'crn',
            'sss',
            'gsis',
            'pag-ibig',
        ],
        patterns: [
            /\bumid\b/i,
            /\bunified\s+multi[-\s]?purpose\s+id\b/i,
            /\bcrn[:\s-]*\d/i,
        ],
        idPatterns: [
            /\b\d{4}-\d{7}-\d\b/,
            /\bcrn[:\s-]*([0-9-]{8,})\b/i,
        ],
    },
    philhealth_id: {
        label: 'PhilHealth ID',
        dropdown: ['philhealth id', 'philhealth'],
        keywords: [
            'philhealth',
            'philippine health insurance',
            'health insurance corporation',
            'pin',
        ],
        patterns: [
            /\bphilhealth\b/i,
            /\bphilippine\s+health\s+insurance\b/i,
            /\bpin[:\s-]*\d/i,
        ],
        idPatterns: [
            /\b\d{2}-\d{9}-\d\b/,
            /\bpin[:\s-]*([0-9-]{8,})\b/i,
        ],
    },
    postal_id: {
        label: 'Postal ID',
        dropdown: ['postal id', 'postal'],
        keywords: [
            'postal id',
            'phlpost',
            'philippine postal',
            'postal corporation',
        ],
        patterns: [
            /\bpostal\s+id\b/i,
            /\bphlpost\b/i,
            /\bphilippine\s+postal\b/i,
        ],
        idPatterns: [
            /\b[A-Z0-9]{3,4}-[A-Z0-9]{3,4}-[A-Z0-9]{3,4}\b/i,
            /\bpostal\s*(?:id|no|number)?[:\s-]*([A-Z0-9-]{6,})\b/i,
        ],
    },
    voter_id: {
        label: "Voter's ID",
        dropdown: ["voter's id", 'voter id', 'voters id'],
        keywords: [
            "voter's id",
            'voter id',
            'commission on elections',
            'comelec',
            'precinct',
        ],
        patterns: [
            /\bvoter'?s?\s+id\b/i,
            /\bcommission\s+on\s+elections\b/i,
            /\bcomelec\b/i,
            /\bprecinct\b/i,
        ],
        idPatterns: [
            /\b\d{4}-\d{4}[A-Z]?\b/i,
            /\bprecinct[:\s-]*([A-Z0-9-]{4,})\b/i,
        ],
    },
    prc_id: {
        label: 'PRC ID',
        dropdown: ['prc id', 'prc', 'professional regulation commission'],
        keywords: [
            'professional regulation commission',
            'professional identification card',
            'prc',
            'registration no',
        ],
        patterns: [
            /\bprofessional\s+regulation\s+commission\b/i,
            /\bprofessional\s+identification\s+card\b/i,
            /\bprc\b/i,
        ],
        idPatterns: [
            /\b\d{7}\b/,
            /\bregistration\s*(?:no|number)?[:\s-]*([A-Z0-9-]{5,})\b/i,
        ],
    },
};

let ocrWorkerPromise = null;
let analysisWorkerPromise = null;
const workerRequests = new Map();

const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[`'’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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

const getOcrWorker = async () => {
    if (!ocrWorkerPromise) {
        ocrWorkerPromise = createWorker('eng', 1, {
            workerPath: `${TESSERACT_BASE}/worker.min.js`,
            corePath: `${TESSERACT_BASE}/core`,
            langPath: `${TESSERACT_BASE}/lang`,
            gzip: true,
            logger: () => {},
        }).then(async (worker) => {
            await worker.setParameters({
                preserve_interword_spaces: '1',
                tessedit_pageseg_mode: '6',
            });

            return worker;
        }).catch((error) => {
            ocrWorkerPromise = null;
            throw error;
        });
    }

    return ocrWorkerPromise;
};

const getAnalysisWorker = () => {
    if (!analysisWorkerPromise) {
        analysisWorkerPromise = Promise.resolve(
            new Worker(new URL('../Workers/identityValidatorWorker.js', import.meta.url), { type: 'module' })
        ).then((worker) => {
            worker.onmessage = (event) => {
                const { requestId, ok, result, error } = event.data || {};
                const entry = workerRequests.get(requestId);
                if (!entry) return;
                clearTimeout(entry.timeout);
                workerRequests.delete(requestId);
                if (ok) {
                    entry.resolve(result);
                } else {
                    entry.reject(new Error(error || 'analysis_failed'));
                }
            };
            return worker;
        }).catch((error) => {
            analysisWorkerPromise = null;
            throw error;
        });
    }
    return analysisWorkerPromise;
};

const runWorkerAnalysis = async (file, options, signal) => {
    if (!window.OffscreenCanvas || !window.Worker) return null;
    const worker = await getAnalysisWorker();
    throwIfAborted(signal);
    const buffer = await file.arrayBuffer();
    throwIfAborted(signal);
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const payload = {
        requestId,
        buffer,
        info: {
            name: file.name,
            type: file.type,
            size: file.size,
        },
        options,
    };

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            workerRequests.delete(requestId);
            reject(new Error('analysis_timeout'));
        }, 12000);

        workerRequests.set(requestId, { resolve, reject, timeout });
        worker.postMessage(payload, [buffer]);
    });
};

const loadCanvas = (file, maxSide = 900) => new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
        URL.revokeObjectURL(url);

        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);

        resolve({
            canvas,
            context,
            width: sourceWidth,
            height: sourceHeight,
            sampleWidth: width,
            sampleHeight: height,
        });
    };

    image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('The selected image cannot be opened by the browser.'));
    };

    image.src = url;
});

const buildQualityIssues = (quality, role, captureRisk) => {
    const issues = [];
    const blockingIssues = [];
    const minWidth = role === 'selfie' ? 360 : 500;
    const minHeight = role === 'selfie' ? 360 : 280;

    if (quality.width < minWidth || quality.height < minHeight) {
        blockingIssues.push('image_resolution_too_low');
    }

    if (quality.brightness < 35) {
        blockingIssues.push('image_too_dark');
    } else if (quality.brightness < 55) {
        issues.push('image_slightly_dark');
    }

    if (quality.brightness > 235) {
        blockingIssues.push('image_overexposed');
    } else if (quality.brightness > 225) {
        issues.push('image_slightly_overexposed');
    }

    if (quality.contrast < 12) {
        blockingIssues.push('image_low_contrast');
    } else if (quality.contrast < 18) {
        issues.push('image_contrast_low');
    }

    if (quality.sharpness < 4.5) {
        blockingIssues.push('image_blurry');
    } else if (quality.sharpness < 7) {
        issues.push('image_soft_focus');
    }

    if (quality.glare_ratio > 0.08) {
        issues.push('image_glare_detected');
    }
    if (quality.shadow_ratio > 0.20) {
        issues.push('image_low_light');
    }
    if (quality.edge_density < 0.012) {
        issues.push('image_low_edge_detail');
    }
    if (captureRisk?.screen_capture_risk === 'high') {
        blockingIssues.push('image_screen_capture_suspected');
    } else if (captureRisk?.screen_capture_risk === 'medium') {
        issues.push('image_screen_capture_suspected');
    }
    if (captureRisk?.tamper_risk === 'high') {
        blockingIssues.push('image_tamper_suspected');
    }

    return { issues, blockingIssues };
};

const analyzeImageQualityFallback = async (file, role) => {
    const loaded = await loadCanvas(file);
    const { context, sampleWidth, sampleHeight, width, height } = loaded;
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    const grayscale = new Uint8Array(sampleWidth * sampleHeight);

    let sum = 0;
    let min = 255;
    let max = 0;
    let glareCount = 0;
    let shadowCount = 0;
    let edgeTotal = 0;
    let edgePixels = 0;
    let noiseTotal = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const luminance = Math.round((0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]));
        grayscale[p] = luminance;
        sum += luminance;
        min = Math.min(min, luminance);
        max = Math.max(max, luminance);
        if (luminance > 240) glareCount += 1;
        if (luminance < 28) shadowCount += 1;
    }

    const pixels = grayscale.length || 1;
    const brightness = sum / pixels;
    let variance = 0;

    for (let i = 0; i < grayscale.length; i += 1) {
        const diff = grayscale[i] - brightness;
        variance += diff * diff;
    }

    for (let y = 1; y < sampleHeight - 1; y += 1) {
        for (let x = 1; x < sampleWidth - 1; x += 1) {
            const index = y * sampleWidth + x;
            const left = grayscale[index - 1];
            const right = grayscale[index + 1];
            const top = grayscale[index - sampleWidth];
            const bottom = grayscale[index + sampleWidth];
            const gradient = Math.hypot(right - left, bottom - top);
            edgeTotal += gradient;
            if (gradient > 28) edgePixels += 1;
            const blur = (left + right + top + bottom + grayscale[index]) / 5;
            noiseTotal += Math.abs(grayscale[index] - blur);
        }
    }

    const contrast = Math.sqrt(variance / pixels);
    const sharpness = edgeTotal / Math.max(1, (sampleWidth - 2) * (sampleHeight - 2));
    const edgeDensity = edgePixels / Math.max(1, (sampleWidth - 2) * (sampleHeight - 2));
    const glareRatio = glareCount / pixels;
    const shadowRatio = shadowCount / pixels;
    const noiseLevel = noiseTotal / Math.max(1, (sampleWidth - 2) * (sampleHeight - 2));
    const aspectRatio = width / Math.max(1, height);
    const captureRisk = {
        screen_capture_score: glareRatio > 0.05 ? 40 : 10,
        tamper_score: 0,
        recapture_score: glareRatio > 0.05 ? 40 : 10,
        screen_capture_risk: glareRatio > 0.08 ? 'high' : glareRatio > 0.05 ? 'medium' : 'low',
        tamper_risk: 'low',
        recapture_risk: glareRatio > 0.08 ? 'high' : glareRatio > 0.05 ? 'medium' : 'low',
    };

    const quality = {
        width,
        height,
        sample_width: sampleWidth,
        sample_height: sampleHeight,
        brightness: Number(brightness.toFixed(2)),
        contrast: Number(contrast.toFixed(2)),
        sharpness: Number(sharpness.toFixed(2)),
        edge_density: Number(edgeDensity.toFixed(4)),
        glare_ratio: Number(glareRatio.toFixed(4)),
        shadow_ratio: Number(shadowRatio.toFixed(4)),
        noise_level: Number(noiseLevel.toFixed(2)),
        aspect_ratio: Number(aspectRatio.toFixed(3)),
        dynamic_range: max - min,
        score: Math.round(clamp(100 - Math.max(0, 48 - brightness) * 1.2 - Math.max(0, 8 - sharpness) * 4, 0, 100)),
    };

    const boundary = {
        method: 'edge_density_aspect_ratio',
        aspect_ratio: quality.aspect_ratio,
        edge_density: quality.edge_density,
        border_edge_ratio: quality.edge_density,
        edge_completeness: quality.edge_density,
        card_like_frame: quality.aspect_ratio >= 1.25
            && quality.aspect_ratio <= 2.25
            && quality.edge_density >= 0.01,
        cropped_risk: quality.edge_density > 0.08 ? 'medium' : 'low',
        document_area_ratio: Number(clamp(edgeDensity * 6, 0, 1).toFixed(3)),
    };

    const { issues, blockingIssues } = buildQualityIssues(quality, role, captureRisk);

    return {
        ...loaded,
        quality: {
            ...quality,
            issues,
            blocking_issues: blockingIssues,
        },
        boundary,
        capture_risk: captureRisk,
    };
};

const analyzeImageQuality = async (file, role, signal) => {
    try {
        const workerResult = await runWorkerAnalysis(file, { maxSide: 900 }, signal);
        if (!workerResult) {
            throw new Error('worker_unavailable');
        }
        const { quality, boundary, capture_risk: captureRisk, width, height, sampleWidth, sampleHeight } = workerResult;
        const { issues, blockingIssues } = buildQualityIssues({ ...quality, width, height }, role, captureRisk);
        return {
            width,
            height,
            sampleWidth,
            sampleHeight,
            quality: {
                ...quality,
                width,
                height,
                sample_width: sampleWidth,
                sample_height: sampleHeight,
                issues,
                blocking_issues: blockingIssues,
            },
            boundary,
            capture_risk: captureRisk,
        };
    } catch (error) {
        if (error?.message === 'analysis_timeout') {
            return analyzeImageQualityFallback(file, role);
        }
        return analyzeImageQualityFallback(file, role);
    }
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

const cleanLine = (line) => line
    .replace(/[^\w\s.,/#():'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

const validateIdImage = async ({ role, file, validIdType, signal }) => {
    const expectedType = resolveDocumentType(validIdType);
    const qualityReport = await analyzeImageQuality(file, role, signal);
    throwIfAborted(signal);

    const diagnostics = {
        mode: 'browser_wasm_v2',
        engine: 'tesseract.js',
        image_role: role,
        document_type: expectedType,
        selected_document_type: validIdType,
        quality: qualityReport.quality,
        boundary: qualityReport.boundary,
        capture_risk: qualityReport.capture_risk,
        issues: [...qualityReport.quality.issues, ...qualityReport.quality.blocking_issues],
        version: ACTIVE_WASM_VERSION,
    };

    if (!expectedType) {
        return invalidResult('Please select a supported ID type before capturing the ID.', diagnostics);
    }

    if (qualityReport.quality.blocking_issues.length > 0 || qualityReport.quality.score < 46) {
        return invalidResult(
            role === 'back_id'
                ? 'The back of ID photo is not clear enough. Please retake a brighter, sharper photo.'
                : 'The front of ID photo is not clear enough. Please retake a brighter, sharper photo.',
            diagnostics
        );
    }

    if (!qualityReport.boundary.card_like_frame || qualityReport.boundary.edge_completeness < 0.32) {
        return invalidResult('Make sure the entire ID fits inside the frame and retake the photo.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'id_edges_incomplete'],
        });
    }

    if (qualityReport.boundary.cropped_risk === 'high' || qualityReport.boundary.document_area_ratio < 0.16) {
        return invalidResult('The ID looks cropped or too small in the frame. Please retake and fill the guide.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'id_document_too_small'],
        });
    }

    if (qualityReport.capture_risk?.screen_capture_risk === 'high' || qualityReport.capture_risk?.tamper_risk === 'high') {
        return invalidResult('This ID looks like a screenshot or edited image. Please use a live camera photo.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'id_screen_capture_suspected'],
        });
    }

    if (qualityReport.capture_risk?.recapture_risk === 'high') {
        return invalidResult('This ID looks re-captured. Please retake a live photo.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'id_recapture_suspected'],
        });
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

    const confidence = Math.round(clamp(
        (qualityReport.quality.score * 0.38)
        + (ocr.confidence * 0.34)
        + (expectedScore * 0.28)
        - (qualityReport.capture_risk?.screen_capture_score || 0) * 0.2,
        0,
        100
    ));

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

    if (ocrText.trim().length < 18 || ocr.confidence < 20) {
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

    return validResult(
        role === 'back_id' ? 'Back of ID looks valid.' : 'ID looks valid.',
        diagnostics,
        {
            document_type: expectedType,
            detected_document_type: detectedType?.type || expectedType,
            fields,
            confidence,
        }
    );
};

const detectFaces = async (file) => {
    if (!('FaceDetector' in window)) {
        return {
            supported: false,
            face_count: null,
            faces: [],
        };
    }

    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
    const bitmap = await createImageBitmap(file);

    try {
        const faces = await detector.detect(bitmap);
        return {
            supported: true,
            face_count: faces.length,
            faces: faces.map((face) => ({
                x: Math.round(face.boundingBox.x),
                y: Math.round(face.boundingBox.y),
                width: Math.round(face.boundingBox.width),
                height: Math.round(face.boundingBox.height),
                center_offset_x: Math.abs((face.boundingBox.x + face.boundingBox.width / 2) - (bitmap.width / 2)) / bitmap.width,
                center_offset_y: Math.abs((face.boundingBox.y + face.boundingBox.height / 2) - (bitmap.height / 2)) / bitmap.height,
                touches_edge: face.boundingBox.x <= 6
                    || face.boundingBox.y <= 6
                    || (face.boundingBox.x + face.boundingBox.width) >= bitmap.width - 6
                    || (face.boundingBox.y + face.boundingBox.height) >= bitmap.height - 6,
                area_ratio: (face.boundingBox.width * face.boundingBox.height) / (bitmap.width * bitmap.height),
            })),
        };
    } finally {
        bitmap.close?.();
    }
};

const validateSelfie = async ({ file, signal }) => {
    const qualityReport = await analyzeImageQuality(file, 'selfie', signal);
    throwIfAborted(signal);

    const diagnostics = {
        mode: 'browser_wasm_v2',
        engine: 'browser_face_detector_quality_worker',
        image_role: 'selfie',
        quality: qualityReport.quality,
        boundary: qualityReport.boundary,
        capture_risk: qualityReport.capture_risk,
        issues: [...qualityReport.quality.issues, ...qualityReport.quality.blocking_issues],
        version: ACTIVE_WASM_VERSION,
    };

    if (qualityReport.quality.blocking_issues.length > 0 || qualityReport.quality.score < 46) {
        return invalidResult('The selfie photo is not clear enough. Please retake a brighter, sharper face photo.', diagnostics);
    }

    if (qualityReport.capture_risk?.screen_capture_risk === 'high' || qualityReport.capture_risk?.recapture_risk === 'high') {
        return invalidResult('The selfie looks like a screen capture. Please use a live camera photo.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'selfie_screen_capture_suspected'],
        });
    }

    if (qualityReport.capture_risk?.tamper_risk === 'high') {
        return invalidResult('The selfie looks edited. Please retake a clean photo.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'selfie_tamper_suspected'],
        });
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

    if (qualityReport.boundary.card_like_frame && qualityReport.boundary.document_area_ratio > 0.2) {
        return invalidResult('The selfie looks like an ID photo. Please capture your face instead.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'selfie_looks_like_id_document'],
        });
    }

    if (!faceReport.supported) {
        const consistencyScore = clamp(
            100 - (qualityReport.capture_risk?.screen_capture_score || 0) * 0.6 - (qualityReport.capture_risk?.tamper_score || 0) * 0.4,
            0,
            100
        );
        const score = Math.round(clamp(
            (qualityReport.quality.score * 0.55) + (consistencyScore * 0.45),
            0,
            100
        ));
        return validResult('Selfie looks valid.', diagnostics, {
            score,
            face_count: null,
            consistency_score: consistencyScore,
        });
    }

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

    const primaryFace = faceReport.faces?.[0];
    const faceAreaRatio = primaryFace?.area_ratio ?? 0;
    if (primaryFace?.touches_edge || primaryFace?.center_offset_x > 0.25 || primaryFace?.center_offset_y > 0.25) {
        return invalidResult('Center your face fully in the frame and retake the selfie.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'selfie_face_cutoff'],
        });
    }

    if (faceAreaRatio < 0.06 || faceAreaRatio > 0.72) {
        return invalidResult('Move your face to the correct distance and retake the selfie.', {
            ...diagnostics,
            issues: [...diagnostics.issues, 'selfie_face_scale_out_of_range'],
        });
    }

    const consistencyScore = clamp(
        100 - (qualityReport.capture_risk?.screen_capture_score || 0) * 0.6 - (qualityReport.capture_risk?.tamper_score || 0) * 0.4,
        0,
        100
    );
    const score = Math.round(clamp(
        (qualityReport.quality.score * 0.46)
        + (consistencyScore * 0.20)
        + (faceAreaRatio ? 100 * 0.34 : 0),
        0,
        100
    ));

    return validResult('Selfie looks valid.', diagnostics, {
        score,
        face_count: faceReport.face_count,
        consistency_score: consistencyScore,
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file.type && !allowedTypes.includes(file.type)) {
        return invalidResult('Please upload a valid image file (JPG, PNG, or WEBP).', {
            mode: 'browser_wasm_v2',
            image_role: role,
            issues: ['unsupported_file_type'],
        });
    }
    if (file.size > 10 * 1024 * 1024) {
        return invalidResult('The image file is too large. Please use a smaller photo.', {
            mode: 'browser_wasm_v2',
            image_role: role,
            issues: ['image_file_too_large'],
        });
    }

    if (role === 'selfie') {
        return validateSelfie({ file, signal });
    }

    return validateIdImage({ role, file, validIdType, signal });
};

export const getWasmIdentityHealth = async () => {
    const assets = [
        `${TESSERACT_BASE}/worker.min.js`,
        `${TESSERACT_BASE}/core/tesseract-core.wasm.js`,
        `${TESSERACT_BASE}/core/tesseract-core.wasm`,
        `${TESSERACT_BASE}/lang/eng.traineddata.gz`,
        getWasmManifestPath(ACTIVE_WASM_VERSION),
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
                mode: 'browser_wasm_v2',
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
            api_calls: 'disabled',
            ocr_engine: 'tesseract.js',
            wasm_version: ACTIVE_WASM_VERSION,
            ocr_assets: checks,
            face_detector: 'FaceDetector' in window ? 'available' : 'not_supported_quality_fallback',
        },
    };
};
