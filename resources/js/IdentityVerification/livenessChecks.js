export const assessPassiveLiveness = ({ quality, forensics, faceAlignment, captureMetadata }) => {
    const issues = [];
    let score = 100;
    const isGalleryUpload = captureMetadata?.source === 'gallery';
    const isCameraCapture = captureMetadata?.source === 'camera';

    if (!isGalleryUpload) {
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
    }

    if (isCameraCapture) {
        const motionScore = Number(captureMetadata.motion_score ?? 0);
        if (motionScore < 0.12) {
            issues.push('selfie_static_frame_risk');
            score -= 14;
        }
    } else if (isGalleryUpload) {
        const galleryAnalysis = captureMetadata?.gallery_analysis;
        if (galleryAnalysis) {
            if (galleryAnalysis.isDark) {
                issues.push('selfie_low_light_gallery');
                score -= 15;
            }
            if (!galleryAnalysis.hasEdges) {
                issues.push('selfie_low_detail_gallery');
                score -= 10;
            }
        }
    }

    if ((quality?.glare_ratio ?? 0) > 0.05) {
        issues.push('selfie_light_reflection_detected');
        score -= 8;
    }

    if ((quality?.low_light_ratio ?? 0) > 0.32) {
        issues.push('selfie_low_light_detected');
        score -= 12;
    }

    if (faceAlignment?.ai_analysis?.quality_indicators) {
        const indicators = faceAlignment.ai_analysis.quality_indicators;
        if (!indicators.centered) {
            issues.push('selfie_face_misaligned');
            score -= 10;
        }
    }

    if (faceAlignment?.score !== undefined) {
        score = (score * 0.72) + (faceAlignment.score * 0.28);
    }

    const passedThreshold = isGalleryUpload ? 58 : 72;
    const hasCriticalIssues = issues.includes('selfie_recapture_risk') || issues.includes('selfie_screen_capture_risk');

    return {
        score: Math.round(Math.max(0, Math.min(100, score))),
        passed: score >= passedThreshold && !hasCriticalIssues,
        is_gallery: isGalleryUpload,
        issues,
        ai_signals: {
            capture_source: captureMetadata?.source || 'unknown',
            motion_score: captureMetadata?.motion_score ?? null,
            recapture_risk: forensics?.recapture_risk ?? null,
            screen_capture_risk: forensics?.screen_capture_risk ?? null,
            static_capture_risk: forensics?.static_capture_risk ?? null,
            face_quality_indicators: faceAlignment?.ai_analysis?.quality_indicators ?? null,
            gallery_analysis: captureMetadata?.gallery_analysis ?? null,
        },
        recommendations: isGalleryUpload ? [
            'For best results, use a live camera capture',
            'Ensure good lighting in your photo',
            'Use a recent, clear photo of yourself',
        ] : null,
    };
};

export const assessDocumentAuthenticity = ({ quality, geometry, forensics }) => {
    const issues = [];
    let score = 100;

    const hasScreenCapture = forensics?.screen_capture_risk >= 70;
    const hasPossibleScreenshot = forensics?.screen_capture_risk >= 45 && forensics?.screen_capture_risk < 70;
    
    if (hasScreenCapture) {
        issues.push('id_screen_capture_detected');
        score -= 35;
    } else if (hasPossibleScreenshot) {
        issues.push('id_possible_screenshot');
        score -= 14;
    }

    const hasRecapture = forensics?.recapture_risk >= 70;
    const hasPossibleRecapture = forensics?.recapture_risk >= 45 && forensics?.recapture_risk < 70;
    
    if (hasRecapture) {
        issues.push('id_recaptured_image_detected');
        score -= 32;
    } else if (hasPossibleRecapture) {
        issues.push('id_possible_recapture');
        score -= 12;
    }

    const hasTamper = forensics?.tamper_risk >= 72;
    const hasPossibleTamper = forensics?.tamper_risk >= 48 && forensics?.tamper_risk < 72;
    
    if (hasTamper) {
        issues.push('id_tamper_signals_detected');
        score -= 34;
    } else if (hasPossibleTamper) {
        issues.push('id_possible_tampering');
        score -= 12;
    }

    if (geometry?.cropped_risk === 'high') {
        issues.push('id_cropped_or_cut_off');
        score -= 26;
    } else if (geometry?.cropped_risk === 'medium') {
        issues.push('id_partial_crop');
        score -= 10;
    }

    if ((geometry?.edge_completeness ?? 1) < 0.35) {
        issues.push('id_edges_incomplete');
        score -= 12;
    }

    if ((quality?.glare_ratio ?? 0) > 0.08) {
        issues.push('id_glare_detected');
        score -= 24;
    }

    const qualityScore = quality?.score ?? 70;
    const authenticityScore = Math.max(0, Math.min(100, score));
    const combinedScore = Math.round((qualityScore * 0.4) + (authenticityScore * 0.6));

    return {
        score: Math.round(Math.max(0, Math.min(100, score))),
        combined_score: combinedScore,
        issues,
        ai_analysis: {
            risk_level: hasScreenCapture || hasRecapture || hasTamper ? 'high' : hasPossibleScreenshot || hasPossibleRecapture || hasPossibleTamper ? 'medium' : 'low',
            detection_confidence: hasScreenCapture || hasRecapture || hasTamper ? 92 : hasPossibleScreenshot || hasPossibleRecapture || hasPossibleTamper ? 68 : 85,
            requires_review: hasPossibleScreenshot || hasPossibleRecapture || hasPossibleTamper,
        },
        signals: {
            screen_capture_risk: forensics?.screen_capture_risk ?? null,
            recapture_risk: forensics?.recapture_risk ?? null,
            tamper_risk: forensics?.tamper_risk ?? null,
            boundary_score: geometry?.boundary_score ?? null,
            edge_completeness: geometry?.edge_completeness ?? null,
        },
    };
};
