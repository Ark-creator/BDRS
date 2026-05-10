const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const riskLabel = (score, medium, high) => {
    if (score >= high) return 'high';
    if (score >= medium) return 'medium';
    return 'low';
};

const analyzeImage = async (buffer, info, options = {}) => {
    const { maxSide = 900 } = options;
    const blob = new Blob([buffer], { type: info?.type || 'image/jpeg' });
    const bitmap = await createImageBitmap(blob);
    const sourceWidth = bitmap.width || 1;
    const sourceHeight = bitmap.height || 1;
    const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    const { data } = context.getImageData(0, 0, width, height);
    const pixels = width * height;
    const grayscale = new Uint8Array(pixels);

    let sum = 0;
    let min = 255;
    let max = 0;
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let glareCount = 0;
    let shadowCount = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = Math.round((0.299 * r) + (0.587 * g) + (0.114 * b));
        grayscale[p] = luminance;
        sum += luminance;
        min = Math.min(min, luminance);
        max = Math.max(max, luminance);
        redTotal += r;
        greenTotal += g;
        blueTotal += b;
        if (luminance > 240) glareCount += 1;
        if (luminance < 28) shadowCount += 1;
    }

    const brightness = sum / pixels;
    let variance = 0;
    let sharpnessTotal = 0;
    let edgeCount = 0;
    let noiseTotal = 0;

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const idx = y * width + x;
            const center = grayscale[idx];
            const left = grayscale[idx - 1];
            const right = grayscale[idx + 1];
            const top = grayscale[idx - width];
            const bottom = grayscale[idx + width];
            const diff = center - brightness;
            variance += diff * diff;
            const laplacian = Math.abs((left + right + top + bottom) - (4 * center));
            sharpnessTotal += laplacian;
            const gx = right - left;
            const gy = bottom - top;
            const gradient = Math.hypot(gx, gy);
            if (gradient > 28) edgeCount += 1;
            const blur = (center + left + right + top + bottom) / 5;
            noiseTotal += Math.abs(center - blur);
        }
    }

    const contrast = Math.sqrt(variance / pixels);
    const sharpness = sharpnessTotal / Math.max(1, (width - 2) * (height - 2));
    const edgeDensity = edgeCount / Math.max(1, (width - 2) * (height - 2));
    const noiseLevel = noiseTotal / Math.max(1, (width - 2) * (height - 2));
    const glareRatio = glareCount / pixels;
    const shadowRatio = shadowCount / pixels;

    const border = Math.max(2, Math.round(Math.min(width, height) * 0.03));
    let borderEdges = 0;
    let borderPixels = 0;
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (y >= border && y < height - border && x >= border && x < width - border) continue;
            borderPixels += 1;
            const idx = y * width + x;
            const left = grayscale[idx - 1] || grayscale[idx];
            const right = grayscale[idx + 1] || grayscale[idx];
            const top = grayscale[idx - width] || grayscale[idx];
            const bottom = grayscale[idx + width] || grayscale[idx];
            const gradient = Math.hypot(right - left, bottom - top);
            if (gradient > 28) borderEdges += 1;
        }
    }
    const borderEdgeRatio = borderPixels ? borderEdges / borderPixels : edgeDensity;

    let blockinessTotal = 0;
    let blockinessCount = 0;
    if (width > 16 && height > 16) {
        for (let y = 7; y < height - 1; y += 8) {
            for (let x = 0; x < width; x += 1) {
                const idx = y * width + x;
                blockinessTotal += Math.abs(grayscale[idx] - grayscale[idx + width]);
                blockinessCount += 1;
            }
        }
        for (let x = 7; x < width - 1; x += 8) {
            for (let y = 0; y < height; y += 1) {
                const idx = y * width + x;
                blockinessTotal += Math.abs(grayscale[idx] - grayscale[idx + 1]);
                blockinessCount += 1;
            }
        }
    }

    const blockiness = blockinessCount ? blockinessTotal / blockinessCount : 0;
    const colorCast = Math.max(redTotal, greenTotal, blueTotal) / pixels - Math.min(redTotal, greenTotal, blueTotal) / pixels;
    const aspectRatio = sourceWidth / Math.max(1, sourceHeight);

    const resolutionScore = Math.min(100, (sourceWidth * sourceHeight) / (900 * 600) * 100);
    const brightnessScore = Math.max(0, 100 - (Math.abs(brightness - 128) / 128 * 100));
    const contrastScore = Math.min(100, contrast / 64 * 100);
    const sharpnessScore = Math.min(100, sharpness / 8 * 100);
    const edgeScore = Math.min(100, edgeDensity * 450);
    const glareScore = Math.max(0, 100 - (glareRatio * 900));
    const shadowScore = Math.max(0, 100 - (shadowRatio * 700));
    const qualityScore = Math.round(
        (resolutionScore * 0.24)
        + (brightnessScore * 0.16)
        + (contrastScore * 0.16)
        + (sharpnessScore * 0.22)
        + (edgeScore * 0.12)
        + (glareScore * 0.05)
        + (shadowScore * 0.05)
    );

    let screenCaptureScore = 0;
    if (info?.type?.includes('png')) screenCaptureScore += 24;
    if (glareRatio > 0.05) screenCaptureScore += 26;
    if (noiseLevel < 5) screenCaptureScore += 22;
    if (edgeDensity < 0.02) screenCaptureScore += 18;

    let tamperScore = 0;
    if (blockiness > 18) tamperScore += 30;
    if (edgeDensity > 0.12 && noiseLevel < 6) tamperScore += 20;
    if (colorCast > 45) tamperScore += 15;

    const recaptureScore = Math.max(screenCaptureScore, tamperScore);
    const cardLike = (aspectRatio >= 1.25 && aspectRatio <= 2.35) || (aspectRatio >= 0.42 && aspectRatio <= 0.85);
    const edgeCompleteness = clamp((borderEdgeRatio + edgeDensity) / 2, 0, 1);

    return {
        width: sourceWidth,
        height: sourceHeight,
        sampleWidth: width,
        sampleHeight: height,
        quality: {
            brightness: Number(brightness.toFixed(2)),
            contrast: Number(contrast.toFixed(2)),
            sharpness: Number(sharpness.toFixed(2)),
            edge_density: Number(edgeDensity.toFixed(4)),
            border_edge_ratio: Number(borderEdgeRatio.toFixed(4)),
            glare_ratio: Number(glareRatio.toFixed(4)),
            shadow_ratio: Number(shadowRatio.toFixed(4)),
            noise_level: Number(noiseLevel.toFixed(2)),
            blockiness: Number(blockiness.toFixed(2)),
            color_cast: Number(colorCast.toFixed(2)),
            aspect_ratio: Number(aspectRatio.toFixed(3)),
            dynamic_range: max - min,
            score: clamp(qualityScore, 0, 100),
        },
        boundary: {
            card_like_frame: cardLike && edgeDensity >= 0.012,
            aspect_ratio: Number(aspectRatio.toFixed(3)),
            edge_density: Number(edgeDensity.toFixed(4)),
            border_edge_ratio: Number(borderEdgeRatio.toFixed(4)),
            edge_completeness: Number(edgeCompleteness.toFixed(3)),
            cropped_risk: borderEdgeRatio > 0.08 ? 'high' : borderEdgeRatio > 0.05 ? 'medium' : 'low',
            document_area_ratio: Number(clamp(edgeDensity * 6, 0, 1).toFixed(3)),
        },
        capture_risk: {
            screen_capture_score: Number(screenCaptureScore.toFixed(2)),
            tamper_score: Number(tamperScore.toFixed(2)),
            recapture_score: Number(recaptureScore.toFixed(2)),
            screen_capture_risk: riskLabel(screenCaptureScore, 35, 60),
            tamper_risk: riskLabel(tamperScore, 25, 55),
            recapture_risk: riskLabel(recaptureScore, 35, 65),
        },
    };
};

self.onmessage = async (event) => {
    const { requestId, buffer, info, options } = event.data || {};
    if (!requestId || !buffer) return;
    try {
        const result = await analyzeImage(buffer, info, options);
        self.postMessage({ requestId, ok: true, result });
    } catch (error) {
        self.postMessage({ requestId, ok: false, error: error?.message || 'analysis_failed' });
    }
};
