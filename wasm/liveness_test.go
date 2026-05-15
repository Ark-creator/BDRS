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
	result := CheckLiveness(m, nil, 0, 0, nil)
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
	result := CheckLiveness(m, nil, 0, 0, nil)
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
	rHigh := CheckLiveness(highSharp, nil, 0, 0, nil)
	rLow := CheckLiveness(lowSharp, nil, 0, 0, nil)
	if rLow.Score >= rHigh.Score {
		t.Errorf("low sharpness score (%f) should be < high sharpness score (%f)", rLow.Score, rHigh.Score)
	}
}

func TestDetectMoire_UniformGradient(t *testing.T) {
	w, h := 100, 100
	gray := make([]uint8, w*h)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			gray[y*w+x] = uint8((x * 255) / w)
		}
	}
	face := FaceBox{X: 10, Y: 10, Width: 80, Height: 80}
	score := detectMoire(gray, w, h, face)
	if score > 50 {
		t.Errorf("expected low moire score for gradient, got %f", score)
	}
}

func TestDetectMoire_PeriodicPattern(t *testing.T) {
	w, h := 100, 100
	gray := make([]uint8, w*h)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			if x%4 < 2 {
				gray[y*w+x] = 255
			} else {
				gray[y*w+x] = 0
			}
		}
	}
	face := FaceBox{X: 10, Y: 10, Width: 80, Height: 80}
	score := detectMoire(gray, w, h, face)
	if score < 20 {
		t.Errorf("expected higher moire score for periodic pattern, got %f", score)
	}
}

func TestLBPUniformity_Smooth(t *testing.T) {
	w, h := 50, 50
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		gray[i] = 128
	}
	face := FaceBox{X: 5, Y: 5, Width: 40, Height: 40}
	score := lbpUniformity(gray, w, h, face)
	if score < 50 {
		t.Errorf("expected high uniformity for smooth image, got %f", score)
	}
}

func TestLBPUniformity_Noisy(t *testing.T) {
	w, h := 50, 50
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		if i%2 == 0 {
			gray[i] = 0
		} else {
			gray[i] = 255
		}
	}
	face := FaceBox{X: 5, Y: 5, Width: 40, Height: 40}
	score := lbpUniformity(gray, w, h, face)
	if score > 80 {
		t.Errorf("expected low uniformity for checkerboard, got %f", score)
	}
}

func TestHistogramBanding_FullRange(t *testing.T) {
	w, h := 50, 50
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		gray[i] = uint8(i % 256)
	}
	score := histogramBanding(gray, w*h)
	if score > 50 {
		t.Errorf("expected few empty bins for full range, got %f", score)
	}
}

func TestHistogramBanding_Binary(t *testing.T) {
	w, h := 50, 50
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		if i%2 == 0 {
			gray[i] = 0
		} else {
			gray[i] = 255
		}
	}
	score := histogramBanding(gray, w*h)
	if score < 150 {
		t.Errorf("expected many empty bins for binary image, got %f", score)
	}
}

func TestEdgeWidthProfile_NoEdges(t *testing.T) {
	w, h := 50, 50
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		gray[i] = 128
	}
	face := FaceBox{X: 5, Y: 5, Width: 40, Height: 40}
	score := edgeWidthProfile(gray, w, h, face)
	if score != 3.0 {
		t.Errorf("expected neutral 3.0 for no edges, got %f", score)
	}
}

func TestPopcount(t *testing.T) {
	tests := []struct {
		input uint8
		want  int
	}{
		{0x00, 0},
		{0x01, 1},
		{0x03, 2},
		{0x07, 3},
		{0xFF, 8},
		{0xAA, 4},
		{0x55, 4},
	}
	for _, tt := range tests {
		if got := popcount(tt.input); got != tt.want {
			t.Errorf("popcount(0x%02X) = %d, want %d", tt.input, got, tt.want)
		}
	}
}

func TestCheckLiveness_MultiSignal_BackwardCompat(t *testing.T) {
	m := QualityMetrics{Sharpness: 10, Contrast: 25, QualityScore: 85, Width: 600, Height: 400, DynamicRange: 200}
	result := CheckLiveness(m, nil, 0, 0, nil)
	if result.Engine != "passive-heuristic-wasm-go" {
		t.Errorf("expected old engine for backward compat, got %s", result.Engine)
	}
	if !result.Passed {
		t.Error("expected pass for high quality with backward compat")
	}
}

func TestCheckLiveness_MultiSignal_WithFaceBox(t *testing.T) {
	w, h := 100, 100
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		gray[i] = 128
	}
	face := FaceBox{X: 20, Y: 20, Width: 60, Height: 60}
	m := QualityMetrics{Sharpness: 10, Contrast: 25, QualityScore: 85, Width: w, Height: h, DynamicRange: 200}
	result := CheckLiveness(m, gray, w, h, &face)
	if result.Engine != "multi-signal-wasm-go" {
		t.Errorf("expected new engine, got %s", result.Engine)
	}
	if _, ok := result.Signals["moire_energy"]; !ok {
		t.Error("expected moire_energy signal")
	}
	if _, ok := result.Signals["spoof_probability"]; !ok {
		t.Error("expected spoof_probability signal")
	}
}
