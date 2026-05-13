package main

import (
	"math"
	"testing"
)

func TestAnalyzeImageQuality_SolidWhite(t *testing.T) {
	rgba := makeSolidRGBA(100, 100, 255, 255, 255)
	m := AnalyzeImageQuality(rgba, 100, 100)
	if math.Abs(m.Brightness-255) > 1 {
		t.Errorf("expected brightness ~255, got %f", m.Brightness)
	}
	if m.DynamicRange != 0 {
		t.Errorf("expected dynamic_range 0, got %d", m.DynamicRange)
	}
	if m.QualityScore <= 0 {
		t.Errorf("expected positive quality score, got %f", m.QualityScore)
	}
}

func TestAnalyzeImageQuality_SolidBlack(t *testing.T) {
	rgba := makeSolidRGBA(100, 100, 0, 0, 0)
	m := AnalyzeImageQuality(rgba, 100, 100)
	if m.Brightness > 1 {
		t.Errorf("expected brightness ~0, got %f", m.Brightness)
	}
}

func TestAnalyzeImageQuality_MidGray(t *testing.T) {
	rgba := makeSolidRGBA(100, 100, 128, 128, 128)
	m := AnalyzeImageQuality(rgba, 100, 100)
	if math.Abs(m.Brightness-128) > 2 {
		t.Errorf("expected brightness ~128, got %f", m.Brightness)
	}
}

func TestAnalyzeImageQuality_Gradient(t *testing.T) {
	rgba := makeGradientRGBA(200, 200)
	m := AnalyzeImageQuality(rgba, 200, 200)
	if m.Sharpness <= 0 {
		t.Errorf("expected positive sharpness for gradient, got %f", m.Sharpness)
	}
	if m.Contrast <= 0 {
		t.Errorf("expected positive contrast for gradient, got %f", m.Contrast)
	}
}

func TestAnalyzeImageQuality_Empty(t *testing.T) {
	m := AnalyzeImageQuality(nil, 0, 0)
	if m.QualityScore != 0 {
		t.Errorf("expected 0 quality for empty, got %f", m.QualityScore)
	}
}

func TestQualityIssues_SharpnessThreshold(t *testing.T) {
	m := QualityMetrics{Sharpness: 6.5, QualityScore: 80, Width: 600, Height: 400, DynamicRange: 200}
	issues := QualityIssues(m, "test")
	found := false
	for _, iss := range issues {
		if iss == "test_blurry" {
			found = true
		}
	}
	if !found {
		t.Error("expected test_blurry for sharpness < 7")
	}

	m.Sharpness = 8.0
	issues = QualityIssues(m, "test")
	for _, iss := range issues {
		if iss == "test_blurry" {
			t.Error("should not flag blurry at sharpness 8")
		}
	}
}

func TestQualityIssues_LowResolution(t *testing.T) {
	m := QualityMetrics{Width: 300, Height: 200, QualityScore: 80, Sharpness: 10, DynamicRange: 200}
	issues := QualityIssues(m, "id")
	found := false
	for _, iss := range issues {
		if iss == "id_low_resolution" {
			found = true
		}
	}
	if !found {
		t.Error("expected id_low_resolution for small image")
	}
}

func TestBrowserQualityChecks_BlocksBlurry(t *testing.T) {
	m := QualityMetrics{Width: 600, Height: 400, Sharpness: 2.0, Brightness: 128, DynamicRange: 200}
	_, blocking := BrowserQualityChecks(m, "id")
	found := false
	for _, b := range blocking {
		if b == "image_blurry" {
			found = true
		}
	}
	if !found {
		t.Error("expected image_blurry blocking for sharpness < 3.2")
	}
}

func TestBrowserQualityChecks_SelfieMinDimensions(t *testing.T) {
	m := QualityMetrics{Width: 400, Height: 400, Sharpness: 10, Brightness: 128, DynamicRange: 200}
	_, blocking := BrowserQualityChecks(m, "selfie")
	for _, b := range blocking {
		if b == "image_resolution_too_low" {
			t.Error("400x400 should pass selfie min 360x360 check")
		}
	}
}
