package main

import "testing"

func TestAnalyzeFraud_Normal(t *testing.T) {
	id := QualityMetrics{QualityScore: 80, Hash: "abc", Width: 600, Height: 400, Sharpness: 10, DynamicRange: 200}
	selfie := QualityMetrics{QualityScore: 75, Hash: "def", Width: 600, Height: 400, Sharpness: 10, DynamicRange: 200}
	result := AnalyzeFraud(id, selfie, "h1", "h2")
	if result.FakeProbability <= 0 {
		t.Errorf("expected positive fake probability, got %f", result.FakeProbability)
	}
}

func TestAnalyzeFraud_DuplicateHash(t *testing.T) {
	id := QualityMetrics{QualityScore: 80, Hash: "same", Width: 600, Height: 400, Sharpness: 10, DynamicRange: 200}
	selfie := QualityMetrics{QualityScore: 75, Hash: "same", Width: 600, Height: 400, Sharpness: 10, DynamicRange: 200}
	result := AnalyzeFraud(id, selfie, "h1", "h1")
	found := false
	for _, iss := range result.Issues {
		if iss == "duplicate_id_and_selfie_image" {
			found = true
		}
	}
	if !found {
		t.Error("expected duplicate_id_and_selfie_image issue")
	}
}

func TestAnalyzeFraud_MetadataFullMetrics(t *testing.T) {
	id := QualityMetrics{QualityScore: 80, Hash: "abc", Width: 600, Height: 400, Sharpness: 10, DynamicRange: 200}
	selfie := QualityMetrics{QualityScore: 75, Hash: "def", Width: 600, Height: 400, Sharpness: 10, DynamicRange: 200}
	result := AnalyzeFraud(id, selfie, "", "")
	if result.Metadata["id"] == nil {
		t.Error("expected id to be full metrics object")
	}
	if result.Metadata["selfie"] == nil {
		t.Error("expected selfie to be full metrics object")
	}
}
