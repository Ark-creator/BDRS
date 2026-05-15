export function createBlinkDetector(options = {}) {
    const {
        requiredBlinks = 2,
        timeoutMs = 5000,
        maxRetries = 3,
        earClosedThreshold = 0.18,
        earOpenThreshold = 0.25,
    } = options;

    let phase = 'waiting';
    let blinkCount = 0;
    let retries = 0;
    let prevEarState = 'open';
    let startTime = null;
    let faceDetector = null;
    let detectorReady = false;

    const initFaceDetector = async () => {
        if (typeof window !== 'undefined' && 'FaceDetector' in window) {
            try {
                faceDetector = new window.FaceDetector();
                detectorReady = true;
            } catch {
                detectorReady = false;
            }
        }
    };

    const computeEAR = (landmarks, width, height) => {
        if (!landmarks || landmarks.length < 6) return null;

        const getPoint = (type) => {
            const lm = landmarks.find((l) => l.type === type || l.type === type.toLowerCase());
            return lm ? lm.location : null;
        };

        const p1 = getPoint('leftEye') || getPoint('rightEye');
        const p2 = getPoint('leftEyeTop') || getPoint('rightEyeTop');
        const p3 = getPoint('leftEyeLeft') || getPoint('rightEyeLeft');
        const p4 = getPoint('leftEyeBottom') || getPoint('rightEyeBottom');
        const p5 = getPoint('leftEyeRight') || getPoint('rightEyeRight');
        const p6 = getPoint('leftEyeTopRight') || getPoint('rightEyeTopRight');

        if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) {
            return null;
        }

        const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

        const vertical1 = dist(p2, p4);
        const vertical2 = dist(p3, p5);
        const horizontal = dist(p1, p6);

        if (horizontal === 0) return null;

        return (vertical1 + vertical2) / (2 * horizontal);
    };

    const analyzeLuminanceFallback = (video, faceBox, canvas) => {
        if (!faceBox || !canvas) return null;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const eyeRegionY1 = Math.max(0, faceBox.y);
        const eyeRegionY2 = Math.min(faceBox.y + faceBox.height / 3, video.videoHeight);
        const eyeRegionX1 = Math.max(0, faceBox.x);
        const eyeRegionX2 = Math.min(faceBox.x + faceBox.width, video.videoWidth);

        if (eyeRegionY2 <= eyeRegionY1 || eyeRegionX2 <= eyeRegionX1) return null;

        ctx.drawImage(video, eyeRegionX1, eyeRegionY1, eyeRegionX2 - eyeRegionX1, eyeRegionY2 - eyeRegionY1, 0, 0, eyeRegionX2 - eyeRegionX1, eyeRegionY2 - eyeRegionY1);
        const imageData = ctx.getImageData(0, 0, eyeRegionX2 - eyeRegionX1, eyeRegionY2 - eyeRegionY1);

        let sum = 0;
        let variance = 0;
        const len = imageData.data.length / 4;
        for (let i = 0; i < imageData.data.length; i += 4) {
            const lum = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
            sum += lum;
        }
        const mean = sum / len;
        for (let i = 0; i < imageData.data.length; i += 4) {
            const lum = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
            variance += (lum - mean) ** 2;
        }
        const stdDev = Math.sqrt(variance / len);

        return stdDev < 8 ? 'closed' : 'open';
    };

    return {
        async init() {
            await initFaceDetector();
            return detectorReady;
        },

        async analyzeFrame(video, faceBox, canvas) {
            if (phase === 'complete' || phase === 'failed') {
                return { complete: phase === 'complete', blinks: blinkCount, phase };
            }

            if (phase === 'waiting') {
                phase = 'detecting';
                startTime = Date.now();
                blinkCount = 0;
                prevEarState = 'open';
            }

            const elapsed = Date.now() - startTime;
            if (elapsed > timeoutMs) {
                if (retries < maxRetries) {
                    retries++;
                    phase = 'waiting';
                    return { complete: false, blinks: blinkCount, phase: 'retry', retriesRemaining: maxRetries - retries };
                }
                phase = 'failed';
                return { complete: false, blinks: blinkCount, phase: 'failed', retriesRemaining: 0 };
            }

            let earState = null;

            if (detectorReady && faceDetector) {
                try {
                    const faces = await faceDetector.detect(video);
                    if (faces.length > 0) {
                        const face = faces[0];
                        const landmarks = face.landmarks || [];
                        const ear = computeEAR(landmarks, video.videoWidth, video.videoHeight);
                        if (ear !== null) {
                            earState = ear < earClosedThreshold ? 'closed' : ear > earOpenThreshold ? 'open' : prevEarState;
                        }
                    }
                } catch {
                    earState = null;
                }
            }

            if (earState === null && faceBox) {
                const lumState = analyzeLuminanceFallback(video, faceBox, canvas);
                if (lumState) {
                    earState = lumState;
                }
            }

            if (earState === null) {
                return { complete: false, blinks: blinkCount, phase: 'detecting', ear: null };
            }

            if (prevEarState === 'open' && earState === 'closed') {
                prevEarState = 'closed';
            } else if (prevEarState === 'closed' && earState === 'open') {
                prevEarState = 'open';
                blinkCount++;
                if (blinkCount >= requiredBlinks) {
                    phase = 'complete';
                    return { complete: true, blinks: blinkCount, phase: 'complete' };
                }
            }

            return { complete: false, blinks: blinkCount, phase: 'detecting', ear: earState };
        },

        getStatus() {
            return {
                phase,
                blinksDetected: blinkCount,
                retriesRemaining: maxRetries - retries,
                requiredBlinks,
            };
        },

        reset() {
            phase = 'waiting';
            blinkCount = 0;
            retries = 0;
            prevEarState = 'open';
            startTime = null;
        },

        isAvailable() {
            return detectorReady;
        },
    };
}
