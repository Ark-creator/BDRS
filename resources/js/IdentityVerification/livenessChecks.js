export const assessPassiveLiveness = ({ quality, forensics, faceAlignment, captureMetadata }) => {
    const issues = [];
    let score = 100;

    if (forensics?.recapture_risk >= 65) {
        issues.push('selfie_recapture_risk');
        score -= 28;
    } else if (forensics?.recapture_risk >= 45) {
        issues.push('selfie_possible_recapture');
        score -= 12;
    }

    if (forensics?.screen_capture_risk >= 70) {
        issues.push('selfie_screen_capture_risk');
        score -= 26;
    }

    if (captureMetadata?.source === 'camera') {
        const motionScore = Number(captureMetadata.motion_score ?? 0);
        if (motionScore < 0.12) {
            issues.push('selfie_static_frame_risk');
            score -= 14;
        }
    } else {
        issues.push('selfie_camera_capture_not_confirmed');
        score -= 8;
    }

    if ((quality?.glare_ratio ?? 0) > 0.05) {
        issues.push('selfie_light_reflection_detected');
        score -= 8;
    }

    if ((quality?.low_light_ratio ?? 0) > 0.32) {
        issues.push('selfie_low_light_detected');
        score -= 12;
    }

    if (faceAlignment?.score !== undefined) {
        score = (score * 0.72) + (faceAlignment.score * 0.28);
    }

    return {
        score: Math.round(Math.max(0, Math.min(100, score))),
        passed: score >= 72 && !issues.includes('selfie_recapture_risk') && !issues.includes('selfie_screen_capture_risk'),
        issues,
        signals: {
            capture_source: captureMetadata?.source || 'unknown',
            motion_score: captureMetadata?.motion_score ?? null,
            recapture_risk: forensics?.recapture_risk ?? null,
            screen_capture_risk: forensics?.screen_capture_risk ?? null,
            static_capture_risk: forensics?.static_capture_risk ?? null,
        },
    };
};

export const assessDocumentAuthenticity = ({ quality, geometry, forensics }) => {
    const issues = [];
    let score = 100;

    if (forensics?.screen_capture_risk >= 70) {
        issues.push('id_screen_capture_detected');
        score -= 35;
    } else if (forensics?.screen_capture_risk >= 45) {
        issues.push('id_possible_screenshot');
        score -= 14;
    }

    if (forensics?.recapture_risk >= 70) {
        issues.push('id_recaptured_image_detected');
        score -= 32;
    } else if (forensics?.recapture_risk >= 45) {
        issues.push('id_possible_recapture');
        score -= 12;
    }

    if (forensics?.tamper_risk >= 72) {
        issues.push('id_tamper_signals_detected');
        score -= 34;
    } else if (forensics?.tamper_risk >= 48) {
        issues.push('id_possible_tampering');
        score -= 12;
    }

    if (geometry?.cropped_risk === 'high') {
        issues.push('id_cropped_or_cut_off');
        score -= 26;
    }

    if ((geometry?.edge_completeness ?? 1) < 0.35) {
        issues.push('id_edges_incomplete');
        score -= 12;
    }

    if ((quality?.glare_ratio ?? 0) > 0.08) {
        issues.push('id_glare_detected');
        score -= 24;
    }

    return {
        score: Math.round(Math.max(0, Math.min(100, score))),
        issues,
        signals: {
            screen_capture_risk: forensics?.screen_capture_risk ?? null,
            recapture_risk: forensics?.recapture_risk ?? null,
            tamper_risk: forensics?.tamper_risk ?? null,
            boundary_score: geometry?.boundary_score ?? null,
            edge_completeness: geometry?.edge_completeness ?? null,
        },
    };
};
