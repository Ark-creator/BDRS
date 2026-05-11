export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const round = (value, places = 2) => Number(value.toFixed(places));

const COMMON_SCREEN_RATIOS = [16 / 9, 18 / 9, 19.5 / 9, 20 / 9, 4 / 3];

const ratioNear = (ratio, expected, tolerance = 0.035) => Math.abs(ratio - expected) <= tolerance;

const weightedQuantile = (histogram, total, quantile) => {
    const target = Math.max(1, total * quantile);
    let running = 0;

    for (let i = 0; i < histogram.length; i += 1) {
        running += histogram[i];
        if (running >= target) return i;
    }

    return histogram.length - 1;
};

const saturationFor = (red, green, blue) => {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    return max === 0 ? 0 : ((max - min) / max) * 255;
};

const averageHash = (grayscale, width, height, size = 8) => {
    const cells = [];
    let sum = 0;

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const startX = Math.floor((x / size) * width);
            const endX = Math.max(startX + 1, Math.floor(((x + 1) / size) * width));
            const startY = Math.floor((y / size) * height);
            const endY = Math.max(startY + 1, Math.floor(((y + 1) / size) * height));
            let cellSum = 0;
            let count = 0;

            for (let yy = startY; yy < endY; yy += 1) {
                for (let xx = startX; xx < endX; xx += 1) {
                    cellSum += grayscale[(yy * width) + xx];
                    count += 1;
                }
            }

            const value = cellSum / Math.max(1, count);
            cells.push(value);
            sum += value;
        }
    }

    const mean = sum / Math.max(1, cells.length);
    return cells.map((value) => (value > mean ? '1' : '0')).join('');
};

const geometryFromEdges = (edgeMap, width, height, edgeDensity) => {
    const xHistogram = new Uint16Array(width);
    const yHistogram = new Uint16Array(height);
    let edgeCount = 0;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (!edgeMap[(y * width) + x]) continue;
            xHistogram[x] += 1;
            yHistogram[y] += 1;
            edgeCount += 1;
        }
    }

    if (edgeCount === 0) {
        return {
            boundary_detected: false,
            boundary_score: 0,
            document_area_ratio: 0,
            document_aspect_ratio: null,
            document_rotation_degrees: null,
            perspective_skew: null,
            cropped_risk: 'unknown',
            edge_completeness: 0,
            quadrilateral: null,
            margins: null,
        };
    }

    const trim = edgeDensity > 0.075 ? 0.035 : 0.018;
    let minX = weightedQuantile(xHistogram, edgeCount, trim);
    let maxX = weightedQuantile(xHistogram, edgeCount, 1 - trim);
    let minY = weightedQuantile(yHistogram, edgeCount, trim);
    let maxY = weightedQuantile(yHistogram, edgeCount, 1 - trim);

    if (maxX <= minX || maxY <= minY) {
        minX = 0;
        minY = 0;
        maxX = width - 1;
        maxY = height - 1;
    }

    let topLeftScore = Infinity;
    let topRightScore = -Infinity;
    let bottomRightScore = -Infinity;
    let bottomLeftScore = -Infinity;
    let topLeft = null;
    let topRight = null;
    let bottomRight = null;
    let bottomLeft = null;

    const boxWidth = Math.max(1, maxX - minX + 1);
    const boxHeight = Math.max(1, maxY - minY + 1);
    const aspectRatio = boxWidth / boxHeight;
    const areaRatio = (boxWidth * boxHeight) / Math.max(1, width * height);
    const marginLeft = minX / width;
    const marginRight = (width - maxX - 1) / width;
    const marginTop = minY / height;
    const marginBottom = (height - maxY - 1) / height;
    const minMargin = Math.min(marginLeft, marginRight, marginTop, marginBottom);
    const maxFill = Math.max(boxWidth / width, boxHeight / height);
    const looksCardLike = (aspectRatio >= 1.2 && aspectRatio <= 2.35) || (aspectRatio >= 0.42 && aspectRatio <= 0.85);
    const boundaryDetected = looksCardLike && areaRatio >= 0.18 && areaRatio <= 0.96 && edgeDensity >= 0.005;

    const sideThicknessX = Math.max(2, Math.round(boxWidth * 0.035));
    const sideThicknessY = Math.max(2, Math.round(boxHeight * 0.035));
    const sideCounts = { top: 0, right: 0, bottom: 0, left: 0 };
    const sideAreas = {
        top: boxWidth * sideThicknessY,
        bottom: boxWidth * sideThicknessY,
        left: boxHeight * sideThicknessX,
        right: boxHeight * sideThicknessX,
    };

    for (let x = minX; x <= maxX; x += 1) {
        for (let y = minY; y < Math.min(maxY, minY + sideThicknessY); y += 1) {
            if (edgeMap[(y * width) + x]) sideCounts.top += 1;
        }
        for (let y = Math.max(minY, maxY - sideThicknessY); y <= maxY; y += 1) {
            if (edgeMap[(y * width) + x]) sideCounts.bottom += 1;
        }
    }

    for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x < Math.min(maxX, minX + sideThicknessX); x += 1) {
            if (edgeMap[(y * width) + x]) sideCounts.left += 1;
        }
        for (let x = Math.max(minX, maxX - sideThicknessX); x <= maxX; x += 1) {
            if (edgeMap[(y * width) + x]) sideCounts.right += 1;
        }
    }

    for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
            if (!edgeMap[(y * width) + x]) continue;

            const sum = x + y;
            const diff = x - y;
            if (sum < topLeftScore) {
                topLeftScore = sum;
                topLeft = { x, y };
            }
            if (diff > topRightScore) {
                topRightScore = diff;
                topRight = { x, y };
            }
            if (sum > bottomRightScore) {
                bottomRightScore = sum;
                bottomRight = { x, y };
            }
            if (-diff > bottomLeftScore) {
                bottomLeftScore = -diff;
                bottomLeft = { x, y };
            }
        }
    }

    const sideCompleteness = Object.entries(sideCounts).map(([side, count]) => {
        const density = count / Math.max(1, sideAreas[side]);
        return clamp(density / 0.015, 0, 1);
    });
    const edgeCompleteness = sideCompleteness.reduce((total, value) => total + value, 0) / sideCompleteness.length;
    const quadrilateral = topLeft && topRight && bottomRight && bottomLeft
        ? [topLeft, topRight, bottomRight, bottomLeft]
        : [
            { x: minX, y: minY },
            { x: maxX, y: minY },
            { x: maxX, y: maxY },
            { x: minX, y: maxY },
        ];
    const rotationRadians = Math.atan2(quadrilateral[1].y - quadrilateral[0].y, quadrilateral[1].x - quadrilateral[0].x);
    const rotationDegrees = rotationRadians * (180 / Math.PI);
    const perspectiveSkew = Math.abs((quadrilateral[1].y - quadrilateral[0].y) - (quadrilateral[2].y - quadrilateral[3].y)) / Math.max(1, boxHeight);
    const boundaryScore = clamp((areaRatio * 75) + (edgeCompleteness * 35) + (looksCardLike ? 18 : 0), 0, 100);
    const croppedRisk = minMargin < 0.012 || maxFill > 0.97 ? 'high' : minMargin < 0.035 || maxFill > 0.92 ? 'medium' : 'low';

    return {
        boundary_detected: boundaryDetected,
        boundary_score: round(boundaryScore),
        document_area_ratio: round(areaRatio, 3),
        document_aspect_ratio: round(aspectRatio, 3),
        document_rotation_degrees: round(rotationDegrees, 1),
        perspective_skew: round(perspectiveSkew, 3),
        cropped_risk: croppedRisk,
        edge_completeness: round(edgeCompleteness, 3),
        quadrilateral: quadrilateral.map((point) => ({
            x: Math.round(point.x),
            y: Math.round(point.y),
            nx: round(point.x / width, 4),
            ny: round(point.y / height, 4),
        })),
        margins: {
            left: round(marginLeft, 3),
            right: round(marginRight, 3),
            top: round(marginTop, 3),
            bottom: round(marginBottom, 3),
        },
    };
};

const forensicSignals = ({
    width,
    height,
    fileSize,
    brightness,
    contrast,
    sharpness,
    glareRatio,
    edgeDensity,
    dynamicRange,
    laplacianVariance,
    captureMetadata,
}) => {
    const aspectRatio = width / Math.max(1, height);
    const normalizedRatio = aspectRatio >= 1 ? aspectRatio : 1 / aspectRatio;
    let screenCaptureRisk = 0;
    let recaptureRisk = 0;
    let tamperRisk = 0;

    if ((fileSize || 0) > 0 && fileSize < 55000 && width * height >= 650000) {
        screenCaptureRisk += 24;
    }

    if (COMMON_SCREEN_RATIOS.some((ratio) => ratioNear(normalizedRatio, ratio))) {
        screenCaptureRisk += 16;
    }

    if (edgeDensity < 0.006 && dynamicRange < 90) {
        screenCaptureRisk += 24;
    }

    if (contrast < 18 && sharpness < 7) {
        screenCaptureRisk += 12;
    }

    if (glareRatio > 0.035 && sharpness < 9) {
        recaptureRisk += 32;
    }

    if (brightness > 210 && contrast < 24) {
        recaptureRisk += 18;
    }

    if (captureMetadata?.source === 'camera' && Number.isFinite(captureMetadata.motion_score)) {
        if (captureMetadata.motion_score < 0.18) {
            recaptureRisk += 10;
        }
    } else {
        recaptureRisk += 8;
    }

    if (laplacianVariance > 2200 && contrast < 22) {
        tamperRisk += 26;
    }

    if (edgeDensity > 0.16 && sharpness > 18 && contrast < 28) {
        tamperRisk += 22;
    }

    if (dynamicRange < 70 || dynamicRange > 252) {
        tamperRisk += 10;
    }

    return {
        screen_capture_risk: Math.round(clamp(screenCaptureRisk, 0, 100)),
        recapture_risk: Math.round(clamp(recaptureRisk, 0, 100)),
        tamper_risk: Math.round(clamp(tamperRisk, 0, 100)),
        static_capture_risk: Math.round(clamp((captureMetadata?.motion_score ?? 0.35) < 0.16 ? 55 : 12, 0, 100)),
    };
};

export const analyzeImageData = ({
    data,
    sampleWidth,
    sampleHeight,
    width,
    height,
    fileSize = 0,
    role,
    captureMetadata = null,
}) => {
    const grayscale = new Uint8Array(sampleWidth * sampleHeight);
    const edgeMap = new Uint8Array(sampleWidth * sampleHeight);
    const histogram = new Uint32Array(256);

    let sum = 0;
    let min = 255;
    let max = 0;
    let glarePixels = 0;
    let lowLightPixels = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        const luminance = Math.round((0.299 * red) + (0.587 * green) + (0.114 * blue));
        const saturation = saturationFor(red, green, blue);

        grayscale[p] = luminance;
        histogram[luminance] += 1;
        sum += luminance;
        min = Math.min(min, luminance);
        max = Math.max(max, luminance);
        if (luminance >= 245 && saturation <= 36) glarePixels += 1;
        if (luminance <= 34) lowLightPixels += 1;
    }

    const pixels = grayscale.length || 1;
    const brightness = sum / pixels;
    let variance = 0;
    let gradientTotal = 0;
    let laplacianTotal = 0;
    let edgePixels = 0;
    let strongEdgePixels = 0;

    for (let i = 0; i < grayscale.length; i += 1) {
        const diff = grayscale[i] - brightness;
        variance += diff * diff;
    }

    for (let y = 1; y < sampleHeight - 1; y += 1) {
        for (let x = 1; x < sampleWidth - 1; x += 1) {
            const index = (y * sampleWidth) + x;
            const left = grayscale[index - 1];
            const right = grayscale[index + 1];
            const up = grayscale[index - sampleWidth];
            const down = grayscale[index + sampleWidth];
            const center = grayscale[index];
            const dx = right - left;
            const dy = down - up;
            const gradient = Math.sqrt((dx * dx) + (dy * dy));
            const laplacian = (center * 4) - left - right - up - down;

            gradientTotal += gradient;
            laplacianTotal += laplacian * laplacian;
            if (gradient > 34) {
                edgeMap[index] = 1;
                edgePixels += 1;
            }
            if (gradient > 72) {
                strongEdgePixels += 1;
            }
        }
    }

    const innerPixels = Math.max(1, (sampleWidth - 2) * (sampleHeight - 2));
    const contrast = Math.sqrt(variance / pixels);
    const sharpness = gradientTotal / innerPixels;
    const laplacianVariance = laplacianTotal / innerPixels;
    const edgeDensity = edgePixels / innerPixels;
    const strongEdgeDensity = strongEdgePixels / innerPixels;
    const aspectRatio = width / Math.max(1, height);
    const dynamicRange = max - min;
    const glareRatio = glarePixels / pixels;
    const lowLightRatio = lowLightPixels / pixels;
    const geometry = role === 'selfie'
        ? null
        : geometryFromEdges(edgeMap, sampleWidth, sampleHeight, edgeDensity);

    const issues = [];
    const blockingIssues = [];
    const minWidth = role === 'selfie' ? 420 : 500;
    const minHeight = role === 'selfie' ? 420 : 280;

    if (width < minWidth || height < minHeight) {
        blockingIssues.push('image_resolution_too_low');
    }

    if (brightness < 35 || lowLightRatio > 0.42) {
        blockingIssues.push('image_too_dark');
    } else if (brightness < 52 || lowLightRatio > 0.28) {
        issues.push('image_slightly_dark');
    }

    if (brightness > 238) {
        blockingIssues.push('image_overexposed');
    } else if (brightness > 225) {
        issues.push('image_bright');
    }

    if (contrast < 13 || dynamicRange < 45) {
        blockingIssues.push('image_low_contrast');
    } else if (contrast < 20) {
        issues.push('image_contrast_low');
    }

    if (sharpness < 4.2 || laplacianVariance < 24) {
        blockingIssues.push('image_blurry');
    } else if (sharpness < 7 || laplacianVariance < 55) {
        issues.push('image_soft_focus');
    }

    if (role !== 'selfie' && glareRatio > 0.08) {
        blockingIssues.push('id_glare_detected');
    } else if (glareRatio > 0.035) {
        issues.push(role === 'selfie' ? 'selfie_glare_detected' : 'id_light_reflection_detected');
    }

    if (role !== 'selfie') {
        if (!geometry?.boundary_detected) {
            issues.push('id_document_boundary_not_found');
        }
        if (geometry?.cropped_risk === 'high') {
            blockingIssues.push('id_cropped_or_cut_off');
        } else if (geometry?.cropped_risk === 'medium') {
            issues.push('id_possible_crop');
        }
        if ((geometry?.edge_completeness ?? 0) < 0.35 && geometry?.boundary_detected) {
            issues.push('id_edges_incomplete');
        }
    }

    if (fileSize > 0 && fileSize < 18000) {
        issues.push('image_file_very_small');
    }

    const forensics = forensicSignals({
        width,
        height,
        fileSize,
        brightness,
        contrast,
        sharpness,
        glareRatio,
        edgeDensity,
        dynamicRange,
        laplacianVariance,
        captureMetadata,
    });

    if (role !== 'selfie') {
        if (forensics.screen_capture_risk >= 70) blockingIssues.push('id_screen_capture_detected');
        else if (forensics.screen_capture_risk >= 45) issues.push('id_possible_screenshot');

        if (forensics.recapture_risk >= 70) blockingIssues.push('id_recaptured_image_detected');
        else if (forensics.recapture_risk >= 45) issues.push('id_possible_recapture');

        if (forensics.tamper_risk >= 72) blockingIssues.push('id_tamper_signals_detected');
        else if (forensics.tamper_risk >= 48) issues.push('id_possible_tampering');
    } else if (forensics.recapture_risk >= 65) {
        issues.push('selfie_possible_recapture');
    }

    let score = 100;
    score -= Math.max(0, 50 - brightness) * 1.1;
    score -= Math.max(0, brightness - 225) * 1.1;
    score -= Math.max(0, 22 - contrast) * 1.65;
    score -= Math.max(0, 8 - sharpness) * 4.2;
    score -= Math.max(0, 60 - laplacianVariance) * 0.18;
    score -= Math.max(0, minWidth - width) * 0.04;
    score -= Math.max(0, minHeight - height) * 0.04;
    score -= glareRatio * (role === 'selfie' ? 120 : 240);
    score -= forensics.screen_capture_risk * (role === 'selfie' ? 0.04 : 0.16);
    score -= forensics.recapture_risk * 0.10;
    score -= forensics.tamper_risk * (role === 'selfie' ? 0.03 : 0.12);
    if (role !== 'selfie' && geometry) {
        score -= Math.max(0, 68 - geometry.boundary_score) * 0.25;
        score -= Math.max(0, 0.55 - geometry.edge_completeness) * 22;
    }

    return {
        width,
        height,
        sample_width: sampleWidth,
        sample_height: sampleHeight,
        quality: {
            width,
            height,
            sample_width: sampleWidth,
            sample_height: sampleHeight,
            brightness: round(brightness),
            contrast: round(contrast),
            sharpness: round(sharpness),
            laplacian_variance: round(laplacianVariance),
            edge_density: round(edgeDensity, 4),
            strong_edge_density: round(strongEdgeDensity, 4),
            aspect_ratio: round(aspectRatio, 3),
            dynamic_range: dynamicRange,
            glare_ratio: round(glareRatio, 4),
            low_light_ratio: round(lowLightRatio, 4),
            score: Math.round(clamp(score, 0, 100)),
            issues,
            blocking_issues: blockingIssues,
        },
        geometry,
        forensics: {
            ...forensics,
            image_signature: averageHash(grayscale, sampleWidth, sampleHeight),
        },
    };
};
