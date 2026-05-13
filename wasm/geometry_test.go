package main

import "testing"

func TestAnalyzeDocumentGeometry_Solid(t *testing.T) {
	rgba := makeSolidRGBA(100, 100, 128, 128, 128)
	result := AnalyzeDocumentGeometry(rgba, 100, 100)
	if result.BoundaryDetected {
		t.Error("solid image should not detect boundary")
	}
}

func TestAnalyzeDocumentGeometry_Gradient(t *testing.T) {
	rgba := makeGradientRGBA(400, 300)
	result := AnalyzeDocumentGeometry(rgba, 400, 300)
	_ = result
}

func TestAnalyzeDocumentGeometry_TooSmall(t *testing.T) {
	rgba := makeSolidRGBA(10, 10, 128, 128, 128)
	result := AnalyzeDocumentGeometry(rgba, 10, 10)
	if result.CroppedRisk != "unknown" {
		t.Error("too small image should return unknown")
	}
}
