package main

import "math"

type SelfieResult struct {
	Engine    string         `json:"engine"`
	Status    string         `json:"status"`
	Passed    bool           `json:"passed"`
	Score     float64        `json:"score"`
	FaceCount int            `json:"face_count"`
	Faces     []FaceBox      `json:"faces"`
	Quality   QualityMetrics `json:"quality"`
	Liveness  LivenessResult `json:"liveness"`
	Issues    []string       `json:"issues"`
}

func ValidateSelfie(rgba []byte, width, height int) SelfieResult {
	metrics := AnalyzeImageQuality(rgba, width, height)
	liveness := CheckLiveness(metrics)
	faceResult := DetectFaces(rgba, width, height, "selfie")

	var issues []string
	issues = append(issues, QualityIssues(metrics, "selfie")...)

	if faceResult.FaceCount == 0 {
		issues = append(issues, "selfie_no_face_detected")
	} else if faceResult.FaceCount > 1 {
		issues = append(issues, "selfie_multiple_faces_detected")
	}

	if liveness.Score < 35 {
		issues = append(issues, "selfie_liveness_failed")
	}

	if len(faceResult.Faces) > 0 {
		largest := faceResult.Faces[0].AreaRatio
		for _, f := range faceResult.Faces[1:] {
			if f.AreaRatio > largest {
				largest = f.AreaRatio
			}
		}
		if largest < 0.018 {
			issues = append(issues, "selfie_face_too_small")
		}
		if largest > 0.85 {
			issues = append(issues, "selfie_face_too_close")
		}
	}

	blockingSet := map[string]bool{
		"selfie_no_face_detected": true, "selfie_multiple_faces_detected": true,
		"selfie_low_resolution": true,
	}

	warningSet := map[string]bool{
		"selfie_low_quality": true, "selfie_blurry": true,
		"selfie_bad_lighting": true, "selfie_low_dynamic_range": true,
		"selfie_glare": true, "selfie_heavy_shadow": true,
		"selfie_liveness_failed": true, "selfie_face_too_small": true,
		"selfie_face_too_close": true,
	}

	faceScore := 0.0
	if faceResult.FaceCount == 1 {
		faceScore = 100.0
	}

	faceDetectionScore := 0.0
	if len(faceResult.Faces) > 0 {
		faceDetectionScore = faceResult.Faces[0].Confidence
	}

	baseScore := metrics.QualityScore*0.25 + faceScore*0.40 + faceDetectionScore*0.15 + liveness.Score*0.20

	warningCount := 0
	for _, iss := range issues {
		if warningSet[iss] {
			warningCount++
		}
	}
	if warningCount > 0 {
		baseScore *= math.Max(0.55, 1.0-float64(warningCount)*0.06)
	}

	score := clampf(baseScore, 0, 98)

	hasBlocking := false
	for _, iss := range issues {
		if blockingSet[iss] {
			hasBlocking = true
			break
		}
	}

	passed := score >= 40 && !hasBlocking
	status := "passed"
	if !passed {
		status = "failed"
	}

	return SelfieResult{
		Engine:    "wasm-go-skin-tone-passive-liveness",
		Status:    status,
		Passed:    passed,
		Score:     round2(score),
		FaceCount: faceResult.FaceCount,
		Faces:     faceResult.Faces,
		Quality:   metrics,
		Liveness:  liveness,
		Issues:    uniqueStrings(issues),
	}
}
