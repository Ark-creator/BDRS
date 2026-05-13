package main

import "testing"

func TestValidateSelfie_NoFace(t *testing.T) {
	rgba := makeSolidRGBA(100, 100, 0, 0, 255)
	result := ValidateSelfie(rgba, 100, 100)
	if result.Passed {
		t.Error("should not pass with no face")
	}
	if result.FaceCount != 0 {
		t.Errorf("expected 0 faces, got %d", result.FaceCount)
	}
}

func TestValidateSelfie_SkinTone(t *testing.T) {
	rgba := makeSolidRGBA(200, 200, 200, 150, 100)
	result := ValidateSelfie(rgba, 200, 200)
	if result.Engine != "wasm-go-skin-tone-passive-liveness" {
		t.Errorf("unexpected engine: %s", result.Engine)
	}
}
