export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const round = (value, places = 2) => Number(value.toFixed(places));

const COMMON_SCREEN_RATIOS = [16 / 9, 18 / 9, 19.5 / 9, 20 / 9, 4 / 3];
const CARD_ASPECT_RATIO = 1.586;

const ratioNear = (ratio, expected, tolerance = 0.035) => Math.abs(ratio - expected) <= tolerance;

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

const emptyGeometry = (reason = 'not_found') => ({
    boundary_detected: false,
    boundary_score: 0,
    document_area_ratio: 0,
    document_aspect_ratio: null,
    document_rotation_degrees: null,
    perspective_skew: null,
    cropped_risk: 'unknown',
    edge_completeness: 0,
    edge_confidence: 0,
    corner_confidence: 0,
    side_confidence: { top: 0, right: 0, bottom: 0, left: 0 },
    missing_edges: ['top', 'right', 'bottom', 'left'],
    corners_inside: false,
    quadrilateral: null,
    centroid: null,
    margins: null,
    detection_reason: reason,
});

const distance = (first, second) => Math.hypot(first.x - second.x, first.y - second.y);

const polygonArea = (points) => Math.abs(points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length];
    return total + ((point.x * next.y) - (next.x * point.y));
}, 0)) / 2;

const orderQuadrilateral = (points) => {
    const center = points.reduce((total, point) => ({
        x: total.x + point.x,
        y: total.y + point.y,
    }), { x: 0, y: 0 });
    center.x /= points.length;
    center.y /= points.length;

    const ordered = [...points].sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
    const startIndex = ordered.reduce((best, point, index) => {
        const bestPoint = ordered[best];
        return point.x + point.y < bestPoint.x + bestPoint.y ? index : best;
    }, 0);

    return [...ordered.slice(startIndex), ...ordered.slice(0, startIndex)];
};

const edgeCoverageBetween = (edgeMap, width, height, start, end) => {
    const length = distance(start, end);
    const steps = Math.max(14, Math.round(length));
    const radius = Math.max(1, Math.round(Math.min(width, height) * 0.006));
    let hits = 0;

    for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = Math.round(start.x + ((end.x - start.x) * t));
        const y = Math.round(start.y + ((end.y - start.y) * t));
        let found = false;

        for (let dy = -radius; dy <= radius && !found; dy += 1) {
            const yy = y + dy;
            if (yy < 1 || yy >= height - 1) continue;

            for (let dx = -radius; dx <= radius; dx += 1) {
                const xx = x + dx;
                if (xx < 1 || xx >= width - 1) continue;
                if (edgeMap[(yy * width) + xx]) {
                    found = true;
                    break;
                }
            }
        }

        if (found) hits += 1;
    }

    return hits / Math.max(1, steps + 1);
};

const serializePoint = (point, width, height) => ({
    x: round(point.x, 1),
    y: round(point.y, 1),
    nx: round(point.x / width, 4),
    ny: round(point.y / height, 4),
});

const geometryFromEdges = (edgeMap, grayscale, saturationMap, width, height, edgeDensity, brightness, contrast) => {
    const pixels = width * height;
    const visited = new Uint8Array(pixels);
    const queue = new Int32Array(pixels);
    const minimumComponentPixels = Math.max(36, Math.round(pixels * 0.006));
    const brightnessFloor = brightness < 72 ? brightness + 16 : 88;
    const documentThreshold = clamp(brightness + Math.max(14, contrast * 0.58), brightnessFloor, 188);
    const isDocumentPixel = (index) => grayscale[index] >= documentThreshold && saturationMap[index] <= 180;
    const candidates = [];

    for (let start = 0; start < pixels; start += 1) {
        if (visited[start] || !isDocumentPixel(start)) continue;

        let queueStart = 0;
        let queueEnd = 0;
        let count = 0;
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let sumX = 0;
        let sumY = 0;
        let sumXX = 0;
        let sumYY = 0;
        let sumXY = 0;

        visited[start] = 1;
        queue[queueEnd] = start;
        queueEnd += 1;

        while (queueStart < queueEnd) {
            const index = queue[queueStart];
            queueStart += 1;

            const x = index % width;
            const y = Math.floor(index / width);
            count += 1;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            sumX += x;
            sumY += y;
            sumXX += x * x;
            sumYY += y * y;
            sumXY += x * y;

            for (let dy = -1; dy <= 1; dy += 1) {
                const yy = y + dy;
                if (yy < 0 || yy >= height) continue;

                for (let dx = -1; dx <= 1; dx += 1) {
                    if (dx === 0 && dy === 0) continue;
                    const xx = x + dx;
                    if (xx < 0 || xx >= width) continue;
                    const next = (yy * width) + xx;
                    if (visited[next] || !isDocumentPixel(next)) continue;

                    visited[next] = 1;
                    queue[queueEnd] = next;
                    queueEnd += 1;
                }
            }
        }

        if (count < minimumComponentPixels) continue;

        const bboxWidth = maxX - minX + 1;
        const bboxHeight = maxY - minY + 1;
        const bboxAreaRatio = (bboxWidth * bboxHeight) / pixels;
        if (bboxAreaRatio > 0.98 || bboxAreaRatio < 0.012) continue;

        const centerX = sumX / count;
        const centerY = sumY / count;
        const covXX = (sumXX / count) - (centerX * centerX);
        const covYY = (sumYY / count) - (centerY * centerY);
        const covXY = (sumXY / count) - (centerX * centerY);
        const theta = 0.5 * Math.atan2(2 * covXY, covXX - covYY);
        let axisX = Math.cos(theta);
        let axisY = Math.sin(theta);
        let crossX = -axisY;
        let crossY = axisX;
        let minU = Infinity;
        let maxU = -Infinity;
        let minV = Infinity;
        let maxV = -Infinity;

        for (let i = 0; i < queueEnd; i += 1) {
            const index = queue[i];
            const x = (index % width) - centerX;
            const y = Math.floor(index / width) - centerY;
            const u = (x * axisX) + (y * axisY);
            const v = (x * crossX) + (y * crossY);
            minU = Math.min(minU, u);
            maxU = Math.max(maxU, u);
            minV = Math.min(minV, v);
            maxV = Math.max(maxV, v);
        }

        let longSide = maxU - minU;
        let shortSide = maxV - minV;
        if (shortSide > longSide) {
            [longSide, shortSide] = [shortSide, longSide];
            [axisX, crossX] = [crossX, axisX];
            [axisY, crossY] = [crossY, axisY];
            [minU, minV] = [minV, minU];
            [maxU, maxV] = [maxV, maxU];
        }

        if (longSide < 18 || shortSide < 12) continue;

        const aspectRatio = longSide / Math.max(1, shortSide);
        if (aspectRatio < 1.18 || aspectRatio > 2.25) continue;

        const rawCorners = [
            { x: centerX + (axisX * minU) + (crossX * minV), y: centerY + (axisY * minU) + (crossY * minV) },
            { x: centerX + (axisX * maxU) + (crossX * minV), y: centerY + (axisY * maxU) + (crossY * minV) },
            { x: centerX + (axisX * maxU) + (crossX * maxV), y: centerY + (axisY * maxU) + (crossY * maxV) },
            { x: centerX + (axisX * minU) + (crossX * maxV), y: centerY + (axisY * minU) + (crossY * maxV) },
        ];
        const quadrilateral = orderQuadrilateral(rawCorners);
        const sideCoverage = {
            top: edgeCoverageBetween(edgeMap, width, height, quadrilateral[0], quadrilateral[1]),
            right: edgeCoverageBetween(edgeMap, width, height, quadrilateral[1], quadrilateral[2]),
            bottom: edgeCoverageBetween(edgeMap, width, height, quadrilateral[2], quadrilateral[3]),
            left: edgeCoverageBetween(edgeMap, width, height, quadrilateral[3], quadrilateral[0]),
        };
        const sideValues = Object.values(sideCoverage);
        const edgeCompleteness = sideValues.reduce((total, value) => total + value, 0) / sideValues.length;
        const minSideCoverage = Math.min(...sideValues);
        const areaRatio = polygonArea(quadrilateral) / pixels;
        const fillRatio = count / Math.max(1, longSide * shortSide);
        const aspectScore = clamp(1 - (Math.abs(aspectRatio - CARD_ASPECT_RATIO) / 0.52), 0, 1);
        const fillScore = clamp((fillRatio - 0.22) / 0.48, 0, 1);
        const textureScore = clamp(edgeDensity / 0.035, 0, 1);
        const boundaryScore = clamp(
            (aspectScore * 35)
            + (edgeCompleteness * 40)
            + (minSideCoverage * 18)
            + (fillScore * 10)
            + (textureScore * 5),
            0,
            100
        );
        const cornersInside = quadrilateral.every((point) => point.x >= 2 && point.y >= 2 && point.x <= width - 3 && point.y <= height - 3);
        const missingEdges = Object.entries(sideCoverage).filter(([, value]) => value < 0.22).map(([side]) => side);

        candidates.push({
            boundaryScore,
            quadrilateral,
            aspectRatio,
            areaRatio,
            edgeCompleteness,
            minSideCoverage,
            sideCoverage,
            cornersInside,
            missingEdges,
            bbox: { minX, maxX, minY, maxY },
            center: { x: centerX, y: centerY },
            fillRatio,
        });
    }

    if (!candidates.length) {
        return emptyGeometry('card_rectangle_not_found');
    }

    candidates.sort((first, second) => second.boundaryScore - first.boundaryScore);
    const candidate = candidates[0];
    const quadrilateral = candidate.quadrilateral;
    const minX = Math.min(...quadrilateral.map((point) => point.x));
    const maxX = Math.max(...quadrilateral.map((point) => point.x));
    const minY = Math.min(...quadrilateral.map((point) => point.y));
    const maxY = Math.max(...quadrilateral.map((point) => point.y));
    const marginLeft = minX / width;
    const marginRight = (width - maxX - 1) / width;
    const marginTop = minY / height;
    const marginBottom = (height - maxY - 1) / height;
    const minMargin = Math.min(marginLeft, marginRight, marginTop, marginBottom);
    const maxFill = Math.max((maxX - minX + 1) / width, (maxY - minY + 1) / height);
    const topLength = distance(quadrilateral[0], quadrilateral[1]);
    const rightLength = distance(quadrilateral[1], quadrilateral[2]);
    const bottomLength = distance(quadrilateral[2], quadrilateral[3]);
    const leftLength = distance(quadrilateral[3], quadrilateral[0]);
    const longEdge = topLength >= rightLength
        ? [quadrilateral[0], quadrilateral[1]]
        : [quadrilateral[1], quadrilateral[2]];
    const rotationRadians = Math.atan2(longEdge[1].y - longEdge[0].y, longEdge[1].x - longEdge[0].x);
    const rotationDegrees = rotationRadians * (180 / Math.PI);
    const horizontalSkew = Math.abs(topLength - bottomLength) / Math.max(1, Math.max(topLength, bottomLength));
    const verticalSkew = Math.abs(leftLength - rightLength) / Math.max(1, Math.max(leftLength, rightLength));
    const perspectiveSkew = (horizontalSkew + verticalSkew) / 2;
    const croppedRisk = !candidate.cornersInside || minMargin < 0.012 || maxFill > 0.97 ? 'high' : minMargin < 0.035 || maxFill > 0.92 ? 'medium' : 'low';
    const boundaryDetected = candidate.boundaryScore >= 58
        && candidate.minSideCoverage >= 0.18
        && candidate.edgeCompleteness >= 0.28
        && candidate.cornersInside
        && candidate.missingEdges.length === 0;

    return {
        boundary_detected: boundaryDetected,
        boundary_score: round(candidate.boundaryScore),
        document_area_ratio: round(candidate.areaRatio, 3),
        document_aspect_ratio: round(candidate.aspectRatio, 3),
        document_rotation_degrees: round(rotationDegrees, 1),
        perspective_skew: round(perspectiveSkew, 3),
        cropped_risk: croppedRisk,
        edge_completeness: round(candidate.edgeCompleteness, 3),
        edge_confidence: round(clamp((candidate.minSideCoverage - 0.18) / 0.48, 0, 1) * 100),
        corner_confidence: round((candidate.cornersInside ? 74 : 45) + (Math.min(candidate.boundaryScore, 100) * 0.26)),
        side_confidence: Object.fromEntries(Object.entries(candidate.sideCoverage).map(([side, value]) => [side, round(clamp((value - 0.18) / 0.48, 0, 1) * 100)])),
        missing_edges: candidate.missingEdges,
        corners_inside: candidate.cornersInside,
        quadrilateral: quadrilateral.map((point) => serializePoint(point, width, height)),
        centroid: serializePoint(candidate.center, width, height),
        margins: {
            left: round(marginLeft, 3),
            right: round(marginRight, 3),
            top: round(marginTop, 3),
            bottom: round(marginBottom, 3),
        },
        detection_reason: boundaryDetected ? 'four_card_edges_detected' : 'edges_incomplete',
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
    const saturationMap = new Uint8Array(sampleWidth * sampleHeight);
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
        saturationMap[p] = Math.round(saturation);
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
        : geometryFromEdges(edgeMap, grayscale, saturationMap, sampleWidth, sampleHeight, edgeDensity, brightness, contrast);

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
