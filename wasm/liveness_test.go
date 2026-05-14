package main

import "testing"

func TestCheckLiveness_HighSharpness(t *testing.T) {
	m := QualityMetrics{
		Sharpness:    10.0,
		Contrast:     30.0,
		QualityScore: 80,
		Width:        600,
		Height:       400,
		DynamicRange: 200,
	}
	result := CheckLiveness(m)
	if !result.Passed {
		t.Error("expected passed for high quality metrics")
	}
	if result.Score < 35 {
		t.Errorf("expected score >= 35, got %f", result.Score)
	}
}

func TestCheckLiveness_LowSharpness(t *testing.T) {
	m := QualityMetrics{
		Sharpness:    2.0,
		Contrast:     30.0,
		QualityScore: 80,
		Width:        600,
		Height:       400,
		DynamicRange: 200,
	}
	result := CheckLiveness(m)
	foundBlurry := false
	for _, iss := range result.Issues {
		if iss == "selfie_blurry" {
			foundBlurry = true
		}
	}
	if !foundBlurry {
		t.Error("expected selfie_blurry for sharpness 2.0 < blurry threshold 3.0")
	}
	if result.Signals["screen_replay_risk"] != "medium" {
		t.Errorf("expected screen_replay_risk=medium for low sharpness, got %v", result.Signals["screen_replay_risk"])
	}
}

func TestCheckLiveness_ScorePenalty(t *testing.T) {
	highSharp := QualityMetrics{Sharpness: 10, Contrast: 25, QualityScore: 85, Width: 600, Height: 400, DynamicRange: 200}
	lowSharp := QualityMetrics{Sharpness: 2, Contrast: 25, QualityScore: 85, Width: 600, Height: 400, DynamicRange: 200}
	rHigh := CheckLiveness(highSharp)
	rLow := CheckLiveness(lowSharp)
	if rLow.Score >= rHigh.Score {
		t.Errorf("low sharpness score (%f) should be < high sharpness score (%f)", rLow.Score, rHigh.Score)
	}
}
