import { createWorker } from 'tesseract.js';

const TESSERACT_BASE = '/vendor/tesseract';

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

const BACK_ID_TEXT_MARKERS = [
    'back of card',
    'serial number',
    'barcode',
    'qr',
    'dl codes',
    'lto codes',
    'restriction',
    'restrictions',
    'conditions',
    'corrective lenses',
    'daylight driving',
    'no hearing aid',
    'motorcycle',
    'vehicle',
    'gross',
    'gvw',
    'organ donor',
    'if found',
    'return to',
    'emergency contact',
    'signature',
];

let ocrWorkerPromise = null;

const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/identificati0n/g, 'identification')
    .replace(/philipp1ne|ph1lippine/g, 'philippine')
    .replace(/licen5e/g, 'license')
    .replace(/\blicence\b/g, 'license')
    .replace(/\blt0\b/g, 'lto')
    .replace(/\b1d\b/g, 'id')
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

const loadCanvas = (file, maxSide = 1200) => new Promise((resolve, reject) => {
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

const estimateBarcodeSignal = (grayscale, width, height) => {
    const yStart = Math.floor(height * 0.32);
    const yEnd = Math.floor(height * 0.92);
    const xStart = Math.floor(width * 0.08);
    const xEnd = Math.floor(width * 0.95);
    let transitions = 0;
    let samples = 0;
    let highTransitionRows = 0;
    let rows = 0;

    for (let y = yStart; y < yEnd; y += 2) {
        let rowTransitions = 0;
        for (let x = xStart + 1; x < xEnd; x += 1) {
            const index = y * width + x;
            const previous = grayscale[index - 1];
            const current = grayscale[index];
            const diff = Math.abs(current - previous);
            if (diff > 34) {
                transitions += 1;
                rowTransitions += 1;
            }
            samples += 1;
        }

        const rowWidth = Math.max(1, xEnd - xStart);
        if ((rowTransitions / rowWidth) > 0.10) {
            highTransitionRows += 1;
        }
        rows += 1;
    }

    const transitionDensity = transitions / Math.max(1, samples);
    const rowDensity = highTransitionRows / Math.max(1, rows);

    return {
        transition_density: Number(transitionDensity.toFixed(4)),
        high_transition_row_ratio: Number(rowDensity.toFixed(4)),
        barcode_like: transitionDensity >= 0.045 && rowDensity >= 0.18,
    };
};

const analyzeImageQuality = async (file, role) => {
    const loaded = await loadCanvas(file);
    const { context, sampleWidth, sampleHeight, width, height } = loaded;
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    const grayscale = new Uint8Array(sampleWidth * sampleHeight);

    let sum = 0;
    let min = 255;
    let max = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    let glarePixels = 0;
    let shadowPixels = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const luminance = Math.round((0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]));
        grayscale[p] = luminance;
        sum += luminance;
        min = Math.min(min, luminance);
        max = Math.max(max, luminance);
        if (luminance < 28) darkPixels += 1;
        if (luminance > 242) brightPixels += 1;
        if (luminance > 248) glarePixels += 1;
        if (luminance < 22) shadowPixels += 1;
    }

    const pixels = grayscale.length || 1;
    const brightness = sum / pixels;
    let variance = 0;
    let gradientTotal = 0;
    let edgePixels = 0;

    for (let i = 0; i < grayscale.length; i += 1) {
        const diff = grayscale[i] - brightness;
        variance += diff * diff;
    }

    for (let y = 1; y < sampleHeight; y += 1) {
        for (let x = 1; x < sampleWidth; x += 1) {
            const index = y * sampleWidth + x;
            const dx = grayscale[index] - grayscale[index - 1];
            const dy = grayscale[index] - grayscale[index - sampleWidth];
            const gradient = Math.sqrt((dx * dx) + (dy * dy));
            gradientTotal += gradient;
            if (gradient > 28) edgePixels += 1;
        }
    }

    const contrast = Math.sqrt(variance / pixels);
    const sharpness = gradientTotal / Math.max(1, (sampleWidth - 1) * (sampleHeight - 1));
    const edgeDensity = edgePixels / Math.max(1, (sampleWidth - 1) * (sampleHeight - 1));
    const aspectRatio = width / Math.max(1, height);
    const dynamicRange = max - min;
    const darkRatio = darkPixels / pixels;
    const brightRatio = brightPixels / pixels;
    const glareRatio = glarePixels / pixels;
    const shadowRatio = shadowPixels / pixels;
    const barcodeSignal = estimateBarcodeSignal(grayscale, sampleWidth, sampleHeight);
    const issues = [];
    const blockingIssues = [];
    const minWidth = role === 'selfie' ? 360 : 500;
    const minHeight = role === 'selfie' ? 360 : 280;

    if (width < minWidth || height < minHeight) {
        blockingIssues.push('image_resolution_too_low');
    }

    if (brightness < 28 || shadowRatio > 0.58) {
        blockingIssues.push('image_too_dark');
    } else if (brightness < 35) {
        issues.push('image_dark_but_recoverable');
    } else if (brightness < 48) {
        issues.push('image_slightly_dark');
    }

    if (brightness > 240 || glareRatio > 0.18) {
        blockingIssues.push('image_overexposed');
    } else if (glareRatio > 0.08 || brightRatio > 0.20) {
        issues.push('image_glare_detected');
    }

    if (dynamicRange < 28) {
        blockingIssues.push('image_low_dynamic_range');
    } else if (contrast < 12 || dynamicRange < 45) {
        issues.push('image_low_contrast_recoverable');
    } else if (contrast < 18) {
        issues.push('image_contrast_low');
    }

    if (sharpness < 3.2) {
        blockingIssues.push('image_blurry');
    } else if (sharpness < 7) {
        issues.push('image_soft_focus');
    }

    if (file.size < 18000) {
        issues.push('image_file_very_small');
    }

    let score = 100;
    score -= Math.max(0, 48 - brightness) * 1.2;
    score -= Math.max(0, brightness - 225) * 1.2;
    score -= Math.max(0, 22 - contrast) * 1.8;
    score -= Math.max(0, 8 - sharpness) * 4;
    score -= Math.max(0, 42 - dynamicRange) * 1.1;
    score -= glareRatio * 110;
    score -= shadowRatio * 80;
    score -= Math.max(0, 500 - width) * 0.04;
    score -= Math.max(0, 280 - height) * 0.04;

    return {
        ...loaded,
        quality: {
            width,
            height,
            sample_width: sampleWidth,
            sample_height: sampleHeight,
            brightness: Number(brightness.toFixed(2)),
            contrast: Number(contrast.toFixed(2)),
            sharpness: Number(sharpness.toFixed(2)),
            edge_density: Number(edgeDensity.toFixed(4)),
            aspect_ratio: Number(aspectRatio.toFixed(3)),
            dynamic_range: dynamicRange,
            dark_pixel_ratio: Number(darkRatio.toFixed(4)),
            bright_pixel_ratio: Number(brightRatio.toFixed(4)),
            glare_ratio: Number(glareRatio.toFixed(4)),
            shadow_ratio: Number(shadowRatio.toFixed(4)),
            barcode_signal: barcodeSignal,
            score: Math.round(clamp(score, 0, 100)),
            issues,
            blocking_issues: blockingIssues,
        },
    };
};

const createCanvasLike = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    return canvas;
};

const cloneCanvas = (source) => {
    const canvas = createCanvasLike(source.width, source.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0);
    return canvas;
};

const filteredCanvas = (source, filter) => {
    const canvas = createCanvasLike(source.width, source.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.filter = filter;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0);
    context.filter = 'none';
    return canvas;
};

const sharpenCanvas = (source, strength = 1.0) => {
    const canvas = cloneCanvas(source);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    const w = canvas.width;
    const h = canvas.height;
    const output = new Uint8ClampedArray(data.length);

    for (let i = 0; i < data.length; i += 4) {
        output[i] = data[i];
        output[i + 1] = data[i + 1];
        output[i + 2] = data[i + 2];
        output[i + 3] = data[i + 3];
    }

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            for (let c = 0; c < 3; c++) {
                const idx = (y * w + x) * 4 + c;
                const top = ((y - 1) * w + x) * 4 + c;
                const bottom = ((y + 1) * w + x) * 4 + c;
                const left = (y * w + (x - 1)) * 4 + c;
                const right = (y * w + (x + 1)) * 4 + c;
                const center = data[idx];
                const sharpened = center + strength * (4 * center - data[top] - data[bottom] - data[left] - data[right]);
                output[idx] = Math.max(0, Math.min(255, Math.round(sharpened)));
            }
        }
    }

    imageData.data.set(output);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
};

const claheLikeCanvas = (source) => {
    const canvas = cloneCanvas(source);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = imageData;
    const w = canvas.width;
    const h = canvas.height;
    const tileSize = Math.max(8, Math.min(32, Math.floor(Math.min(w, h) / 8)));
    const tilesX = Math.ceil(w / tileSize);
    const tilesY = Math.ceil(h / tileSize);
    const tileLut = [];

    for (let ty = 0; ty < tilesY; ty++) {
        tileLut[ty] = [];
        for (let tx = 0; tx < tilesX; tx++) {
            const histogram = new Int32Array(256);
            let count = 0;
            const startX = tx * tileSize;
            const startY = ty * tileSize;
            const endX = Math.min(startX + tileSize, w);
            const endY = Math.min(startY + tileSize, h);

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const lum = Math.round(
                        0.299 * data[(y * w + x) * 4] +
                        0.587 * data[(y * w + x) * 4 + 1] +
                        0.114 * data[(y * w + x) * 4 + 2]
                    );
                    histogram[Math.max(0, Math.min(255, lum))]++;
                    count++;
                }
            }

            const clipLimit = Math.max(1, Math.floor(count / 256 * 2.5));
            let excess = 0;
            for (let i = 0; i < 256; i++) {
                if (histogram[i] > clipLimit) {
                    excess += histogram[i] - clipLimit;
                    histogram[i] = clipLimit;
                }
            }
            const redistribute = Math.floor(excess / 256);
            for (let i = 0; i < 256; i++) histogram[i] += redistribute;

            const cdf = new Float32Array(256);
            cdf[0] = histogram[0];
            for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + histogram[i];
            const cdfMin = cdf.find(v => v > 0) || 0;
            const denom = Math.max(1, count - cdfMin);
            const lut = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                lut[i] = Math.round(((cdf[i] - cdfMin) / denom) * 255);
            }
            tileLut[ty][tx] = lut;
        }
    }

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const fy = y / tileSize - 0.5;
            const fx = x / tileSize - 0.5;
            const ty1 = Math.max(0, Math.floor(fy));
            const ty2 = Math.min(tilesY - 1, ty1 + 1);
            const tx1 = Math.max(0, Math.floor(fx));
            const tx2 = Math.min(tilesX - 1, tx1 + 1);
            const fyFrac = fy - ty1;
            const fxFrac = fx - tx1;

            for (let c = 0; c < 3; c++) {
                const lum = Math.round(
                    c === 0 ? 0.299 * data[idx] : c === 1 ? 0.587 * data[idx + 1] : 0.114 * data[idx + 2]
                );
                const grayVal = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
                const clamped = Math.max(0, Math.min(255, grayVal));

                const v00 = tileLut[ty1][tx1][clamped];
                const v10 = tileLut[ty1][tx2][clamped];
                const v01 = tileLut[ty2][tx1][clamped];
                const v11 = tileLut[ty2][tx2][clamped];

                const mapped = v00 * (1 - fxFrac) * (1 - fyFrac)
                    + v10 * fxFrac * (1 - fyFrac)
                    + v01 * (1 - fxFrac) * fyFrac
                    + v11 * fxFrac * fyFrac;

                const scale = data[idx + c] > 0 ? mapped / Math.max(1, grayVal) : 1;
                data[idx + c] = Math.max(0, Math.min(255, Math.round(data[idx + c] * scale)));
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
};

const thresholdCanvas = (source, mode = 'adaptive') => {
    const canvas = cloneCanvas(source);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = image;
    const luminance = new Uint8Array(canvas.width * canvas.height);
    let sum = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const value = Math.round((0.299 * data[i]) + (0.587 * data[i + 1]) + (0.114 * data[i + 2]));
        luminance[p] = value;
        sum += value;
    }

    const mean = sum / Math.max(1, luminance.length);
    for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
            const index = y * canvas.width + x;
            let threshold = mean;
            if (mode === 'adaptive') {
                let localSum = 0;
                let localCount = 0;
                for (let yy = Math.max(0, y - 6); yy <= Math.min(canvas.height - 1, y + 6); yy += 2) {
                    for (let xx = Math.max(0, x - 6); xx <= Math.min(canvas.width - 1, x + 6); xx += 2) {
                        localSum += luminance[yy * canvas.width + xx];
                        localCount += 1;
                    }
                }
                threshold = (localSum / Math.max(1, localCount)) - 5;
            }

            const output = luminance[index] > threshold ? 255 : 0;
            const offset = index * 4;
            data[offset] = output;
            data[offset + 1] = output;
            data[offset + 2] = output;
            data[offset + 3] = 255;
        }
    }

    context.putImageData(image, 0, 0);
    return canvas;
};

const buildOcrInputs = (qualityReport) => {
    const source = qualityReport.canvas;
    const q = qualityReport.quality;
    const inputs = [
        { profile: 'camera_original', source },
        { profile: 'contrast_wasm', source: filteredCanvas(source, 'grayscale(1) contrast(1.65) brightness(1.08)') },
        { profile: 'shadow_recovery_wasm', source: filteredCanvas(source, 'grayscale(1) contrast(1.35) brightness(1.22)') },
        { profile: 'adaptive_threshold_wasm', source: thresholdCanvas(filteredCanvas(source, 'grayscale(1) contrast(1.45)'), 'adaptive') },
    ];

    if (q.sharpness < 7 || q.score < 65) {
        const grayBase = filteredCanvas(source, 'grayscale(1) contrast(1.3)');
        inputs.push({ profile: 'sharpened_wasm', source: sharpenCanvas(grayBase, 0.8) });
    }

    if (q.brightness < 100 || q.contrast < 25 || q.dynamic_range < 120) {
        inputs.push({ profile: 'clahe_wasm', source: claheLikeCanvas(filteredCanvas(source, 'grayscale(1)')) });
    }

    if (q.glare_ratio > 0.05 || q.bright_pixel_ratio > 0.16) {
        inputs.push({ profile: 'glare_recovery_wasm', source: filteredCanvas(source, 'grayscale(1) contrast(1.5) brightness(0.9)') });
    }

    if (q.dark_pixel_ratio > 0.12 || q.brightness < 60) {
        inputs.push({ profile: 'dark_recovery_wasm', source: filteredCanvas(source, 'grayscale(1) contrast(1.8) brightness(1.35)') });
    }

    if (q.score < 55 && inputs.length < 7) {
        const sharpBase = sharpenCanvas(filteredCanvas(source, 'contrast(1.4)'), 1.2);
        inputs.push({ profile: 'aggressive_sharpen_wasm', source: thresholdCanvas(sharpBase, 'adaptive') });
    }

    return inputs;
};

const mergeOcrResults = (results) => {
    const lines = [];
    const seen = new Set();
    for (const result of [...results].sort((a, b) => b.score - a.score)) {
        for (const line of result.text.split(/\r?\n/)) {
            const cleaned = cleanLine(line);
            const key = normalizeText(cleaned);
            if (!key || seen.has(key) || cleaned.length < 2) continue;
            seen.add(key);
            lines.push(cleaned);
        }
    }

    const sorted = [...results].sort((a, b) => b.score - a.score);
    const best = sorted[0] || { confidence: 0 };
    const top3 = sorted.slice(0, 3);
    const avgConfidence = top3.length
        ? top3.reduce((s, r) => s + r.confidence, 0) / top3.length
        : 0;
    const textLengthScore = Math.min(100, lines.join(' ').length / 3);
    const uniqueLineBonus = Math.min(15, lines.length * 1.5);
    const confidence = Math.round(clamp(
        (avgConfidence * 0.50) + (best.confidence * 0.22) + (textLengthScore * 0.20) + uniqueLineBonus * 0.08,
        0,
        100
    ));

    return {
        ok: true,
        text: lines.join('\n'),
        confidence,
        profiles: results.map(({ profile, confidence: profileConfidence, score, text }) => ({
            profile,
            confidence: profileConfidence,
            score,
            text_length: text.trim().length,
        })),
    };
};

const runOcr = async (source, signal, profile = 'camera_original') => {
    throwIfAborted(signal);
    const worker = await getOcrWorker();
    throwIfAborted(signal);

    const result = await worker.recognize(source);
    throwIfAborted(signal);

    const data = result?.data || {};
    const text = data.text || '';
    const confidence = Math.round(data.confidence || 0);
    return {
        ok: true,
        profile,
        text,
        confidence,
        score: Math.round((confidence * 0.68) + (Math.min(100, text.trim().length / 3) * 0.32)),
        words: data.words || [],
    };
};

const runOcrPipeline = async (qualityReport, signal) => {
    const results = [];
    for (const input of buildOcrInputs(qualityReport)) {
        throwIfAborted(signal);
        try {
            results.push(await runOcr(input.source, signal, input.profile));
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            results.push({
                ok: false,
                profile: input.profile,
                text: '',
                confidence: 0,
                score: 0,
                error: error.message,
            });
        }
    }

    const readableResults = results.filter((result) => result.ok && result.text.trim());
    if (!readableResults.length) {
        const firstError = results.find((result) => result.error);
        if (firstError) {
            throw new Error(firstError.error);
        }
    }

    return mergeOcrResults(readableResults.length ? readableResults : results);
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

const faceDetectionIsConfident = (faceReport) => {
    if (!faceReport || faceReport.face_count !== 1) return false;
    if (faceReport.supported) return true;

    const face = faceReport.faces?.[0];
    if (!face) return false;

    const areaRatio = Number(face.area_ratio || 0);
    const confidence = Number(face.confidence || faceReport.confidence || 0);

    return confidence >= 72 && areaRatio >= 0.035 && areaRatio <= 0.62;
};

const collectBackIdEvidence = (rawText, qualityReport, expectedScore) => {
    const normalized = normalizeText(rawText);
    const markerHits = BACK_ID_TEXT_MARKERS.filter((marker) => normalized.includes(normalizeText(marker)));
    const serialNumberDetected = /\bserial\s*(?:number|no)?[:\s-]*\d{5,}\b/i.test(rawText)
        || /\b\d{7,12}\b/.test(rawText);
    const barcodeLike = Boolean(qualityReport.quality.barcode_signal?.barcode_like);
    const cardLikeFrame = qualityReport.quality.aspect_ratio >= 1.20
        && qualityReport.quality.aspect_ratio <= 2.40
        && qualityReport.quality.edge_density >= 0.01;
    const acceptsLowOcr = barcodeLike && cardLikeFrame;
    const isValid = expectedScore >= 12
        || markerHits.length >= 2
        || (markerHits.length >= 1 && serialNumberDetected)
        || (acceptsLowOcr && rawText.trim().length >= 8)
        || (acceptsLowOcr && qualityReport.quality.score >= 58);

    return {
        marker_hits: markerHits,
        serial_number_detected: serialNumberDetected,
        barcode_like: barcodeLike,
        card_like_frame: cardLikeFrame,
        accepts_low_ocr: acceptsLowOcr,
        is_valid: isValid,
    };
};

const validateIdImage = async ({ role, file, validIdType, signal }) => {
    const expectedType = resolveDocumentType(validIdType);
    const qualityReport = await analyzeImageQuality(file, role);
    throwIfAborted(signal);

    const diagnostics = {
        mode: 'browser_wasm',
        engine: 'tesseract.js-multipass',
        image_role: role,
        document_type: expectedType,
        selected_document_type: validIdType,
        quality: qualityReport.quality,
        issues: [...qualityReport.quality.issues, ...qualityReport.quality.blocking_issues],
        boundary: {
            method: 'edge_density_aspect_ratio',
            aspect_ratio: qualityReport.quality.aspect_ratio,
            edge_density: qualityReport.quality.edge_density,
            card_like_frame: qualityReport.quality.aspect_ratio >= 1.25
                && qualityReport.quality.aspect_ratio <= 2.25
                && qualityReport.quality.edge_density >= 0.01,
        },
        tamper_checks: {
            method: 'client_heuristic',
            screen_capture_detected: false,
            edited_id_detected: false,
        },
    };

    if (!expectedType) {
        return invalidResult('Please select a supported ID type before capturing the ID.', diagnostics);
    }

    if (qualityReport.quality.blocking_issues.length > 0 || qualityReport.quality.score < 30) {
        return invalidResult(
            role === 'back_id'
                ? 'The back of ID photo is not clear enough. Please retake a brighter, sharper photo.'
                : 'The front of ID photo is not clear enough. Please retake a brighter, sharper photo.',
            diagnostics
        );
    }

    let ocr;
    try {
        ocr = await runOcrPipeline(qualityReport, signal);
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
        profiles: ocr.profiles || [],
        preview: ocrText.replace(/\s+/g, ' ').trim().slice(0, 180),
    };
    diagnostics.detected_document_type = detectedType?.type || null;
    diagnostics.detected_document_label = detectedType?.label || null;
    diagnostics.expected_document_score = expectedScore;
    diagnostics.fields = fields;
    diagnostics.confidence = Math.round((qualityReport.quality.score + ocr.confidence + expectedScore) / 3);
    const backIdEvidence = role === 'back_id'
        ? collectBackIdEvidence(ocrText, qualityReport, expectedScore)
        : null;
    if (backIdEvidence) {
        diagnostics.back_side_evidence = backIdEvidence;
    }

    if ((ocrText.trim().length < 18 || ocr.confidence < 20) && !backIdEvidence?.accepts_low_ocr) {
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

    if (role === 'back_id' && !backIdEvidence?.is_valid) {
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
        }
    );
};

const estimateFacesBySkinAndGeometry = async (file) => {
    const loaded = await loadCanvas(file, 720);
    const { context, sampleWidth, sampleHeight } = loaded;
    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight);
    const components = [];
    const visited = new Uint8Array(sampleWidth * sampleHeight);
    const skinMask = new Uint8Array(sampleWidth * sampleHeight);

    for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
            const offset = (y * sampleWidth + x) * 4;
            const r = data[offset];
            const g = data[offset + 1];
            const b = data[offset + 2];
            const maxChannel = Math.max(r, g, b);
            const minChannel = Math.min(r, g, b);
            const rg = r - g;
            const rb = r - b;
            const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
            const likelySkin = luminance > 35
                && luminance < 245
                && r > 55
                && g > 35
                && b > 20
                && maxChannel - minChannel > 12
                && rg > -8
                && rb > 8;

            if (likelySkin) {
                skinMask[y * sampleWidth + x] = 1;
            }
        }
    }

    const queue = [];
    const minArea = Math.max(120, Math.round(sampleWidth * sampleHeight * 0.012));
    for (let y = 0; y < sampleHeight; y += 3) {
        for (let x = 0; x < sampleWidth; x += 3) {
            const start = y * sampleWidth + x;
            if (!skinMask[start] || visited[start]) continue;

            let minX = x;
            let maxX = x;
            let minY = y;
            let maxY = y;
            let area = 0;
            queue.length = 0;
            queue.push([x, y]);
            visited[start] = 1;

            while (queue.length) {
                const [cx, cy] = queue.shift();
                area += 1;
                minX = Math.min(minX, cx);
                maxX = Math.max(maxX, cx);
                minY = Math.min(minY, cy);
                maxY = Math.max(maxY, cy);

                for (const [nx, ny] of [[cx + 3, cy], [cx - 3, cy], [cx, cy + 3], [cx, cy - 3]]) {
                    if (nx < 0 || ny < 0 || nx >= sampleWidth || ny >= sampleHeight) continue;
                    const index = ny * sampleWidth + nx;
                    if (!skinMask[index] || visited[index]) continue;
                    visited[index] = 1;
                    queue.push([nx, ny]);
                }
            }

            const boxWidth = maxX - minX + 1;
            const boxHeight = maxY - minY + 1;
            const aspect = boxWidth / Math.max(1, boxHeight);
            if (area >= minArea && aspect >= 0.45 && aspect <= 1.25) {
                const areaRatio = (boxWidth * boxHeight) / Math.max(1, sampleWidth * sampleHeight);
                const centerX = (minX + (boxWidth / 2)) / sampleWidth;
                const centerY = (minY + (boxHeight / 2)) / sampleHeight;
                const centered = 1 - Math.min(1, Math.abs(centerX - 0.5) + Math.abs(centerY - 0.42));
                components.push({
                    x: minX,
                    y: minY,
                    width: boxWidth,
                    height: boxHeight,
                    area_ratio: Number(areaRatio.toFixed(4)),
                    confidence: Math.round(clamp((areaRatio * 230) + (centered * 45), 0, 92)),
                    detector: 'skin_geometry_wasm_fallback',
                });
            }
        }
    }

    const faces = components
        .sort((a, b) => b.confidence - a.confidence)
        .filter((face, index, all) => index === all.findIndex((other) => (
            Math.abs(other.x - face.x) < 28 && Math.abs(other.y - face.y) < 28
        )))
        .slice(0, 3);

    if (!faces.length || faces[0].confidence < 72) {
        return {
            supported: false,
            fallback: 'skin_geometry_wasm_fallback',
            face_count: 0,
            faces: [],
            confidence: faces[0]?.confidence || 0,
        };
    }

    return {
        supported: false,
        fallback: 'skin_geometry_wasm_fallback',
        face_count: faces.length,
        faces,
        confidence: faces[0].confidence,
    };
};

const detectFaces = async (file) => {
    if ('FaceDetector' in window) {
        const detector = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 3 });
        const bitmap = await createImageBitmap(file);
        let nativeError = null;

        try {
            const faces = await detector.detect(bitmap);
            if (faces.length > 0) {
                return {
                    supported: true,
                    face_count: faces.length,
                    faces: faces.map((face) => ({
                        x: Math.round(face.boundingBox.x),
                        y: Math.round(face.boundingBox.y),
                        width: Math.round(face.boundingBox.width),
                        height: Math.round(face.boundingBox.height),
                        detector: 'browser_face_detector',
                    })),
                };
            }
        } catch (error) {
            nativeError = error;
        } finally {
            bitmap.close?.();
        }

        const fallback = await estimateFacesBySkinAndGeometry(file);
        return {
            ...fallback,
            native_error: nativeError?.message,
        };
    }

    return estimateFacesBySkinAndGeometry(file);
};

const validateSelfie = async ({ file, signal }) => {
    const qualityReport = await analyzeImageQuality(file, 'selfie');
    throwIfAborted(signal);

    const diagnostics = {
        mode: 'browser_wasm',
        engine: 'browser_face_detector_wasm_quality',
        image_role: 'selfie',
        quality: qualityReport.quality,
        issues: [...qualityReport.quality.issues, ...qualityReport.quality.blocking_issues],
    };

    if (qualityReport.quality.blocking_issues.length > 0 || qualityReport.quality.score < 42) {
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

    if (!faceDetectionIsConfident(faceReport)) {
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

    return validResult('Selfie looks valid.', diagnostics, {
        score: qualityReport.quality.score,
        face_count: faceReport.face_count,
    });
};

export const validateRegistrationImageWasm = async ({ role, file, validIdType, signal }) => {
    if (!file) {
        return invalidResult('Please capture an image first.', {
            mode: 'browser_wasm',
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
    const assets = [
        `${TESSERACT_BASE}/worker.min.js`,
        `${TESSERACT_BASE}/core/tesseract-core.wasm.js`,
        `${TESSERACT_BASE}/core/tesseract-core.wasm`,
        `${TESSERACT_BASE}/lang/eng.traineddata.gz`,
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
            ocr_pipeline: 'multi_pass_canvas_preprocessing',
            ocr_assets: checks,
            face_detector: 'FaceDetector' in window ? 'available' : 'skin_geometry_wasm_fallback',
        },
    };
};
