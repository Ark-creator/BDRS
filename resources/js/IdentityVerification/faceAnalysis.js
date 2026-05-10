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

export const assessFaceAlignment = (faceReport, quality) => {
    const faces = faceReport?.faces || [];
    const width = quality?.width || 1;
    const height = quality?.height || 1;

    if (!faces.length) {
        return {
            status: 'missing',
            score: 0,
            issues: ['selfie_no_face_detected'],
        };
    }

    if (faces.length > 1) {
        return {
            status: 'multiple',
            score: 0,
            issues: ['selfie_multiple_faces_detected'],
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

    if (faceAreaRatio < 0.055) {
        issues.push('selfie_face_too_small');
    }

    if (faceAreaRatio > 0.58) {
        issues.push('selfie_face_too_close');
    }

    if (Math.min(marginLeft, marginRight, marginTop) < 0.018 || marginBottom < 0.006) {
        issues.push('selfie_partial_face_visibility');
    }

    if (centerOffset > 0.22) {
        issues.push('selfie_face_off_center');
    }

    let score = 100;
    score -= Math.max(0, 0.10 - faceAreaRatio) * 340;
    score -= Math.max(0, faceAreaRatio - 0.42) * 160;
    score -= centerOffset * 150;
    if (issues.includes('selfie_partial_face_visibility')) score -= 34;

    return {
        status: issues.length ? 'adjust' : 'aligned',
        score: Math.round(Math.max(0, Math.min(100, score))),
        issues,
        metrics: {
            face_area_ratio: round(faceAreaRatio, 4),
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
    };
};
