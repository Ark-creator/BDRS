const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

self.onmessage = (event) => {
    const { id, data, width, height, fullWidth, fullHeight, role } = event.data || {};

    try {
        const pixels = new Uint8ClampedArray(data);
        const totalPixels = Math.max(1, width * height);
        const grayscale = new Float32Array(totalPixels);

        let sum = 0;
        let min = 255;
        let max = 0;
        let glarePixels = 0;
        let darkPixels = 0;
        let saturationSum = 0;

        for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);
            grayscale[p] = luminance;
            sum += luminance;
            min = Math.min(min, luminance);
            max = Math.max(max, luminance);

            const maxRgb = Math.max(r, g, b);
            const minRgb = Math.min(r, g, b);
            const saturation = maxRgb ? (maxRgb - minRgb) / maxRgb : 0;
            saturationSum += saturation;

            if (luminance > 235 && saturation < 0.12) {
                glarePixels += 1;
            }

            if (luminance < 40) {
                darkPixels += 1;
            }
        }

        const brightness = sum / totalPixels;
        let variance = 0;

        for (let i = 0; i < grayscale.length; i += 1) {
            const diff = grayscale[i] - brightness;
            variance += diff * diff;
        }

        const contrast = Math.sqrt(variance / totalPixels);

        let gradientTotal = 0;
        let edgePixels = 0;
        let borderEdges = 0;
        const border = Math.max(2, Math.round(Math.min(width, height) * 0.05));

        for (let y = 1; y < height; y += 1) {
            for (let x = 1; x < width; x += 1) {
                const index = y * width + x;
                const dx = grayscale[index] - grayscale[index - 1];
                const dy = grayscale[index] - grayscale[index - width];
                const gradient = Math.sqrt((dx * dx) + (dy * dy));
                gradientTotal += gradient;
                if (gradient > 28) {
                    edgePixels += 1;
                    if (x < border || x > (width - border) || y < border || y > (height - border)) {
                        borderEdges += 1;
                    }
                }
            }
        }

        const samplePixels = Math.max(1, (width - 1) * (height - 1));
        const sharpness = gradientTotal / samplePixels;
        const edgeDensity = edgePixels / samplePixels;
        const glareRatio = glarePixels / totalPixels;
        const lowLightRatio = darkPixels / totalPixels;
        const saturationAvg = saturationSum / totalPixels;
        const dynamicRange = max - min;
        const textureScore = clamp((sharpness * 12) + (contrast * 2), 0, 100);
        const edgeCompleteness = edgePixels ? borderEdges / edgePixels : 0;
        const aspectRatio = fullWidth / Math.max(1, fullHeight);
        const cardLike = aspectRatio >= 1.2 && aspectRatio <= 2.35;
        const boundaryDetected = cardLike && edgeCompleteness > 0.18 && edgeDensity > 0.012;
        const croppedRisk = edgeCompleteness > 0.45 ? 'high' : edgeCompleteness > 0.28 ? 'medium' : 'low';

        const screenCaptureRisk = clamp((edgeDensity * 180) + (glareRatio * 260) - (contrast * 1.2) - (saturationAvg * 30), 0, 100) / 100;
        const recaptureRisk = clamp((glareRatio * 240) + (lowLightRatio * 140) + (edgeDensity * 100) - (sharpness * 4), 0, 100) / 100;

        const issues = [];
        const blockingIssues = [];
        const minWidth = role === 'selfie' ? 360 : 500;
        const minHeight = role === 'selfie' ? 360 : 280;

        if (fullWidth < minWidth || fullHeight < minHeight) {
            blockingIssues.push('image_resolution_too_low');
        }

        if (brightness < 35) {
            blockingIssues.push('image_too_dark');
        } else if (brightness < 48) {
            issues.push('image_slightly_dark');
        }

        if (brightness > 235) {
            blockingIssues.push('image_overexposed');
        }

        if (contrast < 12) {
            blockingIssues.push('image_low_contrast');
        } else if (contrast < 18) {
            issues.push('image_contrast_low');
        }

        if (sharpness < 4.5) {
            blockingIssues.push('image_blurry');
        } else if (sharpness < 7) {
            issues.push('image_soft_focus');
        }

        if (glareRatio > 0.18) {
            blockingIssues.push('image_glare_strong');
        } else if (glareRatio > 0.08) {
            issues.push('image_glare_detected');
        }

        if (lowLightRatio > 0.35) {
            blockingIssues.push('image_low_light');
        }

        let score = 100;
        score -= Math.max(0, 48 - brightness) * 1.2;
        score -= Math.max(0, brightness - 225) * 1.2;
        score -= Math.max(0, 22 - contrast) * 1.8;
        score -= Math.max(0, 8 - sharpness) * 4;
        score -= Math.max(0, glareRatio - 0.05) * 160;
        score -= Math.max(0, lowLightRatio - 0.2) * 120;
        score -= Math.max(0, 500 - fullWidth) * 0.04;
        score -= Math.max(0, 280 - fullHeight) * 0.04;

        self.postMessage({
            id,
            payload: {
                quality: {
                    width: fullWidth,
                    height: fullHeight,
                    sample_width: width,
                    sample_height: height,
                    brightness: Number(brightness.toFixed(2)),
                    contrast: Number(contrast.toFixed(2)),
                    sharpness: Number(sharpness.toFixed(2)),
                    edge_density: Number(edgeDensity.toFixed(4)),
                    aspect_ratio: Number(aspectRatio.toFixed(3)),
                    dynamic_range: dynamicRange,
                    glare_ratio: Number(glareRatio.toFixed(4)),
                    low_light_ratio: Number(lowLightRatio.toFixed(4)),
                    texture_score: Number(textureScore.toFixed(2)),
                    saturation_mean: Number(saturationAvg.toFixed(3)),
                    screen_capture_risk: Number(screenCaptureRisk.toFixed(3)),
                    recapture_risk: Number(recaptureRisk.toFixed(3)),
                    edge_completeness: Number(edgeCompleteness.toFixed(3)),
                    score: Math.round(clamp(score, 0, 100)),
                    issues,
                    blocking_issues: blockingIssues,
                },
                geometry: {
                    boundary_detected: boundaryDetected,
                    boundary_score: Math.round(clamp((edgeDensity * 140) + (edgeCompleteness * 90), 0, 100)),
                    document_area_ratio: Number(clamp(edgeDensity * 6, 0, 1).toFixed(3)),
                    document_aspect_ratio: Number(aspectRatio.toFixed(3)),
                    edge_completeness: Number(edgeCompleteness.toFixed(3)),
                    cropped_risk: croppedRisk,
                    card_like_frame: cardLike,
                },
            },
        });
    } catch (error) {
        self.postMessage({
            id,
            error: error?.message || 'Failed to analyze image quality.',
        });
    }
};
