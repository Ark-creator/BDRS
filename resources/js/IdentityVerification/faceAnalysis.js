const round = (value, places = 3) => Number(value.toFixed(places));

export const detectFaces = async (file) => {
    if (!('FaceDetector' in window)) {
        return {
            supported: false,
            face_count: null,
            faces: [],
        };
    }

    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
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
                landmarks: face.landmarks || [],
            })),
        };
    } finally {
        bitmap.close?.();
    }
};

export const analyzeFacialFeatures = async (file) => {
    const faces = await detectFaces(file);
    
    if (!faces.supported || faces.faces.length !== 1) {
        return {
            detected: faces.faces.length === 1,
            quality: 'unknown',
            landmarks_detected: false,
            expression: null,
        };
    }
    
    const face = faces.faces[0];
    const hasLandmarks = face.landmarks && face.landmarks.length > 0;
    
    let expression = null;
    let qualityScore = 50;
    
    if (hasLandmarks) {
        const eyeLeft = face.landmarks.find(l => l.name?.toLowerCase().includes('eye') && l.name?.toLowerCase().includes('left'));
        const eyeRight = face.landmarks.find(l => l.name?.toLowerCase().includes('eye') && l.name?.toLowerCase().includes('right'));
        const nose = face.landmarks.find(l => l.name?.toLowerCase().includes('nose'));
        const mouth = face.landmarks.find(l => l.name?.toLowerCase().includes('mouth'));
        
        const hasAllKeyPoints = eyeLeft && eyeRight && nose && mouth;
        
        if (hasAllKeyPoints) {
            qualityScore = 85;
            expression = 'neutral';
            
            const eyeDistance = Math.sqrt(
                Math.pow(eyeRight.x - eyeLeft.x, 2) + Math.pow(eyeRight.y - eyeLeft.y, 2)
            );
            const noseToMouth = Math.sqrt(
                Math.pow(mouth.x - nose.x, 2) + Math.pow(mouth.y - nose.y, 2)
            );
            
            if (noseToMouth < eyeDistance * 0.3) {
                expression = 'close_up';
            } else if (noseToMouth > eyeDistance * 0.8) {
                expression = 'far';
            }
        } else {
            qualityScore = 65;
        }
    }
    
    return {
        detected: true,
        quality: qualityScore >= 75 ? 'good' : qualityScore >= 50 ? 'acceptable' : 'poor',
        quality_score: qualityScore,
        landmarks_detected: hasLandmarks,
        expression,
        face_box: {
            x: (face.x / (face.width + face.x)) * 100,
            y: (face.y / (face.height + face.y)) * 100,
            width: (face.width / (face.width + face.x)) * 100,
            height: (face.height / (face.height + face.y)) * 100,
        },
    };
};

export const assessFaceAlignment = (faceReport, quality) => {
    const faces = faceReport?.faces || [];
    const width = quality?.width || 1;
    const height = quality?.height || 1;

    if (!faces.length) {
        return {
            status: 'missing',
            score: 0,
            issues: ['selfie_no_face_detected'],
            ai_analysis: {
                confidence: 95,
                recommendation: 'Position your face in the center of the frame',
            },
        };
    }

    if (faces.length > 1) {
        return {
            status: 'multiple',
            score: 0,
            issues: ['selfie_multiple_faces_detected'],
            ai_analysis: {
                confidence: 92,
                recommendation: 'Only one face should be visible in the selfie',
            },
        };
    }

    const face = faces[0];
    const faceCenterX = (face.x + (face.width / 2)) / width;
    const faceCenterY = (face.y + (face.height / 2)) / height;
    const faceAreaRatio = (face.width * face.height) / Math.max(1, width * height);
    const marginLeft = face.x / width;
    const marginRight = (width - face.x - face.width) / width;
    const marginTop = face.y / height;
    const marginBottom = (height - face.y - face.height) / height;
    const centerOffset = Math.sqrt(((faceCenterX - 0.5) ** 2) + ((faceCenterY - 0.46) ** 2));
    const issues = [];

    const optimalAreaMin = 0.12;
    const optimalAreaMax = 0.45;
    
    if (faceAreaRatio < optimalAreaMin) {
        const severity = optimalAreaMin - faceAreaRatio;
        issues.push(severity > 0.05 ? 'selfie_face_too_small' : 'selfie_face_very_small');
    }

    if (faceAreaRatio > optimalAreaMax) {
        issues.push('selfie_face_too_close');
    }

    const minMargin = 0.025;
    if (Math.min(marginLeft, marginRight, marginTop) < minMargin || marginBottom < 0.01) {
        issues.push('selfie_partial_face_visibility');
    }

    if (centerOffset > 0.22) {
        issues.push('selfie_face_off_center');
    }

    let score = 100;
    score -= Math.max(0, (optimalAreaMin - faceAreaRatio) * 450);
    score -= Math.max(0, (faceAreaRatio - optimalAreaMax * 0.8) * 180);
    score -= centerOffset * 140;
    if (issues.includes('selfie_partial_face_visibility')) score -= 30;
    if (issues.includes('selfie_face_off_center')) score -= 20;
    
    const hasLandmarks = face.landmarks && face.landmarks.length > 0;
    if (hasLandmarks) {
        score += 8;
    }
    
    const aiConfidence = hasLandmarks ? 92 : 78;
    const getRecommendation = () => {
        if (issues.includes('selfie_face_too_small') || issues.includes('selfie_face_very_small')) {
            return 'Move closer to the camera for a clearer face';
        }
        if (issues.includes('selfie_face_too_close')) {
            return 'Move back slightly to fit your entire face in the frame';
        }
        if (issues.includes('selfie_partial_face_visibility')) {
            return 'Adjust position to show your full face with even margins';
        }
        if (issues.includes('selfie_face_off_center')) {
            return 'Center your face in the frame';
        }
        return 'Face is well positioned';
    };

    return {
        status: issues.length ? 'adjust' : 'aligned',
        score: Math.round(Math.max(0, Math.min(100, score))),
        issues,
        metrics: {
            face_area_ratio: round(faceAreaRatio, 4),
            optimal_range: { min: optimalAreaMin, max: optimalAreaMax },
            face_center_x: round(faceCenterX),
            face_center_y: round(faceCenterY),
            center_offset: round(centerOffset),
            margins: {
                left: round(marginLeft),
                right: round(marginRight),
                top: round(marginTop),
                bottom: round(marginBottom),
            },
        },
        ai_analysis: {
            confidence: aiConfidence,
            landmarks_detected: hasLandmarks,
            recommendation: getRecommendation(),
            quality_indicators: {
                size_optimal: faceAreaRatio >= optimalAreaMin && faceAreaRatio <= optimalAreaMax,
                centered: centerOffset < 0.15,
                fully_visible: !issues.includes('selfie_partial_face_visibility'),
            },
        },
    };
};
