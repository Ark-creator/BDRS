const SCAN_WIDTH = 220;
const STABILITY_HISTORY_SIZE = 8;
const AUTO_CAPTURE_READY_NEEDED = 5;
const AUTO_CAPTURE_COUNTDOWN = 3;
const STABILITY_THRESHOLD = 75;
const QUALITY_THRESHOLD = 60;

export const createStabilityTracker = () => {
    const history = [];
    let prevGray = null;
    let prevLen = 0;

    return {
        measure(gray, len) {
            let motion = 100;
            if (prevGray && prevLen === len) {
                let diff = 0;
                for (let i = 0; i < len; i += 3) {
                    diff += Math.abs(gray[i] - prevGray[i]);
                }
                motion = Math.max(0, 100 - (diff / (len / 3)) * 3.2);
            }
            if (!prevGray || prevLen !== len) {
                prevGray = new Uint8Array(len);
            }
            prevGray.set(gray instanceof Uint8Array ? gray : new Uint8Array(gray));
            prevLen = len;

            history.push(motion);
            if (history.length > STABILITY_HISTORY_SIZE) history.shift();

            const avg = history.reduce((s, v) => s + v, 0) / history.length;
            return {
                motion: Math.round(motion),
                stability: Math.round(avg),
                isStable: avg >= STABILITY_THRESHOLD,
            };
        },
        reset() {
            history.length = 0;
            prevGray = null;
            prevLen = 0;
        },
    };
};

const computeGrayscaleStats = (data, width, height) => {
    const len = width * height;
    const gray = new Uint8Array(len);
    let sum = 0, glareCount = 0, shadowCount = 0;
    let minLum = 255, maxLum = 0;

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        gray[p] = lum;
        sum += lum;
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
        if (lum > 248) glareCount++;
        if (lum < 24) shadowCount++;
    }

    const brightness = sum / Math.max(1, len);
    const glareRatio = glareCount / Math.max(1, len);
    const shadowRatio = shadowCount / Math.max(1, len);
    const dynamicRange = maxLum - minLum;

    let variance = 0;
    for (let i = 0; i < len; i++) {
        const diff = gray[i] - brightness;
        variance += diff * diff;
    }

    const guideLeft = Math.floor(width * 0.11);
    const guideRight = Math.floor(width * 0.89);
    const guideTop = Math.floor(height * 0.26);
    const guideBottom = Math.floor(height * 0.74);

    let gradientTotal = 0;
    let edgeCount = 0;
    let guideEdges = 0, guideTotal = 0;
    let outerEdges = 0, outerTotal = 0;
    let leftEdgeSum = 0, rightEdgeSum = 0;
    let topEdgeSum = 0, bottomEdgeSum = 0;
    const guideMidX = (guideLeft + guideRight) / 2;
    const guideMidY = (guideTop + guideBottom) / 2;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const dx = gray[idx] - gray[idx - 1];
            const dy = gray[idx] - gray[idx - width];
            const grad = Math.sqrt(dx * dx + dy * dy);
            gradientTotal += grad;

            if (grad > 28) {
                edgeCount++;
                if (x >= guideLeft && x <= guideRight && y >= guideTop && y <= guideBottom) {
                    guideEdges++;
                    if (x < guideMidX) leftEdgeSum++;
                    else rightEdgeSum++;
                    if (y < guideMidY) topEdgeSum++;
                    else bottomEdgeSum++;
                } else {
                    outerEdges++;
                }
            }
            if (x >= guideLeft && x <= guideRight && y >= guideTop && y <= guideBottom) guideTotal++;
            else outerTotal++;
        }
    }

    const contrast = Math.sqrt(variance / Math.max(1, len));
    const sharpness = gradientTotal / Math.max(1, (width - 1) * (height - 1));
    const edgeDensity = edgeCount / Math.max(1, (width - 1) * (height - 1));
    const guideEdgeDensity = guideEdges / Math.max(1, guideTotal);

    let lapSum = 0, lapSqSum = 0, lapCount = 0;
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const lap = gray[idx - width] + gray[idx + width] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
            lapSum += lap;
            lapSqSum += lap * lap;
            lapCount++;
        }
    }
    const lapMean = lapSum / Math.max(1, lapCount);
    const lapVariance = (lapSqSum / Math.max(1, lapCount)) - (lapMean * lapMean);
    const blurScore = Math.min(100, Math.round(Math.sqrt(Math.max(0, lapVariance)) * 1.5));

    const le = leftEdgeSum || 1;
    const re = rightEdgeSum || 1;
    const te = topEdgeSum || 1;
    const be = bottomEdgeSum || 1;
    const hTilt = Math.abs(le - re) / Math.max(le, re);
    const vTilt = Math.abs(te - be) / Math.max(te, be);
    const tiltAngle = Math.round(Math.sqrt(hTilt * hTilt + vTilt * vTilt) * 45);
    const isTilted = tiltAngle > 12;

    const guideArea = (guideRight - guideLeft) * (guideBottom - guideTop);
    const edgeCoverage = guideEdges / Math.max(1, guideArea);
    let distance = 'good';
    if (edgeCoverage < 0.008 || edgeDensity < 0.01) distance = 'too_far';
    else if (edgeCoverage > 0.08 && guideEdgeDensity > (outerEdges / Math.max(1, outerTotal)) * 3) distance = 'too_close';

    let motionDirection = null;
    if (height > 2 && width > 2) {
        const bottomGrad = gradientTotal * 0.6;
        let topGrad = 0, botGrad = 0;
        const midY = Math.floor(height / 2);
        for (let y = 1; y < midY; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const dx = Math.abs(gray[idx] - gray[idx - 1]);
                const dy = Math.abs(gray[idx] - gray[idx - width]);
                topGrad += Math.sqrt(dx * dx + dy * dy);
            }
        }
        for (let y = midY; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const dx = Math.abs(gray[idx] - gray[idx - 1]);
                const dy = Math.abs(gray[idx] - gray[idx - width]);
                botGrad += Math.sqrt(dx * dx + dy * dy);
            }
        }
    }

    return {
        gray, brightness, contrast, sharpness, edgeDensity, dynamicRange,
        glareRatio, shadowRatio, blurScore,
        guideEdgeDensity, distance, isTilted, tiltAngle, edgeCoverage,
    };
};

export const analyzeCameraFrame = (video, captureTarget, stabilityTracker) => {
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;
    if (!width || !height) return null;

    const sampleH = Math.max(1, Math.round((height / width) * SCAN_WIDTH));
    const canvas = document.createElement('canvas');
    canvas.width = SCAN_WIDTH;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, SCAN_WIDTH, sampleH);
    const imageData = ctx.getImageData(0, 0, SCAN_WIDTH, sampleH);

    const stats = computeGrayscaleStats(imageData.data, SCAN_WIDTH, sampleH);
    const stability = stabilityTracker
        ? stabilityTracker.measure(stats.gray, stats.gray.length)
        : { motion: 0, stability: 100, isStable: true };

    const isFace = captureTarget === 'face';

    let score = 100;
    score -= Math.max(0, 44 - stats.brightness) * 1.3;
    score -= Math.max(0, stats.brightness - 230) * 1.2;
    score -= Math.max(0, 16 - stats.contrast) * 2.1;
    score -= Math.max(0, 6 - stats.sharpness) * 5;
    score -= stats.glareRatio * 120;
    score -= stats.shadowRatio * 90;
    score -= Math.max(0, 25 - stats.blurScore) * 0.8;
    if (!isFace) {
        if (stats.distance === 'too_far') score -= 20;
        if (stats.distance === 'too_close') score -= 10;
        if (stats.isTilted) score -= 8;
    }
    score = Math.round(Math.max(0, Math.min(100, score)));

    const cardFramed = !isFace && stats.guideEdgeDensity >= 0.01;
    const faceReady = isFace && stats.brightness >= 42 && stats.brightness <= 225 && stats.contrast >= 13 && stats.sharpness >= 4.2;
    const ready = isFace
        ? faceReady
        : cardFramed && stats.brightness >= 38 && stats.brightness <= 232 && stats.contrast >= 11 && stats.sharpness >= 3.8 && !stats.isTilted;

    const status = ready && score >= 58 ? 'ready' : score >= 42 ? 'adjust' : 'poor';

    let message, detailMessage;
    const frameColor = status === 'ready' ? 'green' : status === 'adjust' ? 'yellow' : 'red';

    if (status === 'ready') {
        message = isFace ? 'Face photo ready' : 'ID detected';
        detailMessage = stability.isStable ? 'Ready to capture' : 'Hold steady';
    } else if (stats.brightness < 38) {
        message = 'Add more light';
        detailMessage = 'Move to a brighter area';
    } else if (stats.brightness > 232 || stats.glareRatio > 0.08) {
        message = 'Reduce glare';
        detailMessage = 'Avoid reflections on the ID';
    } else if (stats.blurScore < 20) {
        message = 'Image is blurry';
        detailMessage = 'Clean your lens and hold steady';
    } else if (!stability.isStable && stability.stability < 50) {
        message = 'Hold steady';
        detailMessage = 'Keep your device still';
    } else if (!isFace && stats.distance === 'too_far') {
        message = 'Move closer';
        detailMessage = 'Bring the ID nearer to the camera';
    } else if (!isFace && stats.distance === 'too_close') {
        message = 'Move farther';
        detailMessage = 'Move the ID away slightly';
    } else if (!isFace && stats.isTilted) {
        message = 'Straighten the ID';
        detailMessage = 'Align the ID horizontally';
    } else if (stats.shadowRatio > 0.15) {
        message = 'Remove shadows';
        detailMessage = 'Even out the lighting on the ID';
    } else {
        message = isFace ? 'Center your face' : 'Align the ID inside the frame';
        detailMessage = isFace ? 'Position your face in the oval' : 'Fill the guide with the ID';
    }

    let lightingIssue = null;
    if (stats.brightness < 38) lightingIssue = 'dark';
    else if (stats.brightness > 232 || stats.glareRatio > 0.08) lightingIssue = 'glare';
    else if (stats.shadowRatio > 0.15) lightingIssue = 'shadow';

    return {
        status, message, detailMessage, score, frameColor,
        brightness: Math.round(stats.brightness),
        contrast: Number(stats.contrast.toFixed(1)),
        sharpness: Number(stats.sharpness.toFixed(1)),
        edgeDensity: Number(stats.edgeDensity.toFixed(4)),
        blurScore: stats.blurScore,
        stability,
        distance: stats.distance,
        isTilted: stats.isTilted,
        tiltAngle: stats.tiltAngle,
        glareRatio: Number(stats.glareRatio.toFixed(4)),
        shadowRatio: Number(stats.shadowRatio.toFixed(4)),
        lightingIssue,
    };
};

export const createAutoCaptureManager = (options = {}) => {
    const readyNeeded = options.readyFrames || AUTO_CAPTURE_READY_NEEDED;
    const countdownFrames = options.countdownFrames || AUTO_CAPTURE_COUNTDOWN;
    let readyCount = 0;
    let countdownRemaining = countdownFrames;
    let phase = 'waiting';
    let capturing = false;
    let enabled = false;

    return {
        update(analysis) {
            if (!enabled || capturing) return { shouldCapture: false, countdown: 0 };

            const conditionsMet = analysis
                && analysis.status === 'ready'
                && analysis.stability.isStable
                && analysis.score >= QUALITY_THRESHOLD;

            if (!conditionsMet) {
                if (phase === 'countdown') {
                    phase = 'waiting';
                    readyCount = Math.max(0, readyCount - 2);
                    countdownRemaining = countdownFrames;
                } else {
                    readyCount = Math.max(0, readyCount - 1);
                }
                return { shouldCapture: false, countdown: 0 };
            }

            if (phase === 'waiting') {
                readyCount++;
                if (readyCount >= readyNeeded) {
                    phase = 'countdown';
                    countdownRemaining = countdownFrames;
                }
                return { shouldCapture: false, countdown: 0 };
            }

            const display = countdownRemaining;
            countdownRemaining--;
            if (countdownRemaining <= 0) {
                capturing = true;
                return { shouldCapture: true, countdown: 0 };
            }
            return { shouldCapture: false, countdown: display };
        },
        setEnabled(val) {
            enabled = val;
            readyCount = 0;
            countdownRemaining = countdownFrames;
            phase = 'waiting';
            capturing = false;
        },
        isEnabled: () => enabled,
        reset() {
            readyCount = 0;
            countdownRemaining = countdownFrames;
            phase = 'waiting';
            capturing = false;
        },
        finishCapture() {
            capturing = false;
            readyCount = 0;
            countdownRemaining = countdownFrames;
            phase = 'waiting';
        },
    };
};

export const getCameraErrorMessage = (error) => {
    const name = error?.name || '';
    const msg = error?.message || '';

    if (name === 'NotAllowedError' || msg.includes('Permission')) {
        return {
            title: 'Camera Access Denied',
            message: 'Please allow camera access in your browser settings to continue.',
            steps: [
                'Click the camera icon in your browser address bar',
                'Select "Allow" for camera access',
                'Click "Retry" below',
            ],
            canRetry: true,
        };
    }
    if (name === 'NotFoundError') {
        return {
            title: 'No Camera Found',
            message: 'No camera was detected on your device.',
            steps: [
                'Connect a camera to your device',
                'Make sure it is properly connected',
                'Click "Retry" to try again',
            ],
            canRetry: true,
        };
    }
    if (name === 'NotReadableError' || name === 'AbortError') {
        return {
            title: 'Camera Unavailable',
            message: 'The camera is being used by another application or is not responding.',
            steps: [
                'Close other apps that may be using the camera',
                'Restart your browser',
                'Click "Retry" to try again',
            ],
            canRetry: true,
        };
    }
    if (name === 'OverconstrainedError') {
        return {
            title: 'Camera Settings Issue',
            message: 'Your camera does not support the requested settings. A fallback will be used.',
            steps: [],
            canRetry: true,
        };
    }
    if (name === 'SecurityError') {
        return {
            title: 'Camera Blocked',
            message: 'Camera access is blocked for security reasons. Make sure you are using HTTPS.',
            steps: [
                'Ensure the website is loaded over HTTPS',
                'Check your browser security settings',
            ],
            canRetry: false,
        };
    }
    return {
        title: 'Camera Error',
        message: `Could not access the camera. ${msg || 'Please ensure you have granted camera permission.'}`,
        steps: [
            'Check that camera permissions are enabled',
            'Try refreshing the page',
            'Try using a different browser',
        ],
        canRetry: true,
    };
};

export const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
            supported: false,
            message: 'Your browser does not support camera access. Please use a modern browser like Chrome, Safari, or Firefox.',
        };
    }
    return { supported: true, message: '' };
};
