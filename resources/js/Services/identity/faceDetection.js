export const detectFaces = async (file) => {
    if (!('FaceDetector' in window)) {
        return {
            supported: false,
            face_count: null,
            faces: [],
        };
    }

    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
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
            })),
        };
    } finally {
        bitmap.close?.();
    }
};

export const analyzeFacePosition = (face, imageWidth, imageHeight) => {
    if (!face) {
        return {
            area_ratio: 0,
            centered: false,
            off_center_distance: null,
            touches_edge: false,
        };
    }

    const areaRatio = (face.width * face.height) / Math.max(1, (imageWidth * imageHeight));
    const centerX = face.x + (face.width / 2);
    const centerY = face.y + (face.height / 2);
    const offsetX = Math.abs(centerX - (imageWidth / 2)) / Math.max(1, imageWidth / 2);
    const offsetY = Math.abs(centerY - (imageHeight / 2)) / Math.max(1, imageHeight / 2);
    const offCenter = Math.max(offsetX, offsetY);
    const touchesEdge = face.x <= 8 || face.y <= 8
        || (face.x + face.width) >= imageWidth - 8
        || (face.y + face.height) >= imageHeight - 8;

    return {
        area_ratio: Number(areaRatio.toFixed(4)),
        centered: offCenter <= 0.32,
        off_center_distance: Number(offCenter.toFixed(3)),
        touches_edge: touchesEdge,
    };
};
