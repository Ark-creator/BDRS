package main

import (
	"math"
	"testing"
)

func TestFaceIoU_NoOverlap(t *testing.T) {
	a := FaceBox{X: 0, Y: 0, Width: 50, Height: 50}
	b := FaceBox{X: 100, Y: 100, Width: 50, Height: 50}
	if iou := faceIoU(a, b); iou != 0 {
		t.Errorf("expected 0 IoU for non-overlapping, got %f", iou)
	}
}

func TestFaceIoU_Identical(t *testing.T) {
	a := FaceBox{X: 10, Y: 10, Width: 50, Height: 50}
	b := FaceBox{X: 10, Y: 10, Width: 50, Height: 50}
	if iou := faceIoU(a, b); math.Abs(iou-1.0) > 0.01 {
		t.Errorf("expected ~1.0 IoU for identical, got %f", iou)
	}
}

func TestFaceIoU_Partial(t *testing.T) {
	a := FaceBox{X: 0, Y: 0, Width: 100, Height: 100}
	b := FaceBox{X: 50, Y: 50, Width: 100, Height: 100}
	iou := faceIoU(a, b)
	if iou <= 0 || iou >= 1 {
		t.Errorf("expected partial IoU between 0 and 1, got %f", iou)
	}
	expected := float64(50*50) / float64(100*100+100*100-50*50)
	if math.Abs(iou-expected) > 0.01 {
		t.Errorf("expected %f, got %f", expected, iou)
	}
}

func TestNmsFaces_Suppresses(t *testing.T) {
	faces := []FaceBox{
		{X: 10, Y: 10, Width: 50, Height: 50, Confidence: 90},
		{X: 12, Y: 12, Width: 50, Height: 50, Confidence: 80},
	}
	selected := nmsFaces(faces, 0.35)
	if len(selected) != 1 {
		t.Errorf("expected 1 face after NMS, got %d", len(selected))
	}
	if selected[0].Confidence != 90 {
		t.Errorf("expected highest confidence face, got %f", selected[0].Confidence)
	}
}

func TestDetectFaces_NoSkin(t *testing.T) {
	rgba := makeSolidRGBA(100, 100, 0, 0, 255)
	result := DetectFaces(rgba, 100, 100, "selfie")
	if result.FaceCount != 0 {
		t.Errorf("expected 0 faces for blue image, got %d", result.FaceCount)
	}
}

func TestDetectFaces_SkinTone(t *testing.T) {
	rgba := makeSolidRGBA(100, 100, 200, 150, 100)
	result := DetectFaces(rgba, 100, 100, "selfie")
	if result.Engine != "skin-tone-wasm-go" {
		t.Errorf("unexpected engine: %s", result.Engine)
	}
}

func TestIsSkinYCbCr_SkinTone(t *testing.T) {
	tests := []struct {
		r, g, b float64
		want    bool
	}{
		{200, 150, 100, true},
		{180, 130, 90, true},
		{255, 255, 255, false},
		{0, 0, 255, false},
	}
	for _, tt := range tests {
		got := isSkinYCbCr(tt.r, tt.g, tt.b)
		if got != tt.want {
			t.Errorf("isSkinYCbCr(%.0f,%.0f,%.0f) = %v, want %v", tt.r, tt.g, tt.b, got, tt.want)
		}
	}
}

func TestIsSkinHSV_SkinTone(t *testing.T) {
	tests := []struct {
		r, g, b float64
		want    bool
	}{
		{200, 150, 100, true},
		{180, 130, 90, true},
		{255, 255, 255, false},
		{0, 0, 255, false},
	}
	for _, tt := range tests {
		got := isSkinHSV(tt.r, tt.g, tt.b)
		if got != tt.want {
			t.Errorf("isSkinHSV(%.0f,%.0f,%.0f) = %v, want %v", tt.r, tt.g, tt.b, got, tt.want)
		}
	}
}

func TestIsSkin_Ensemble(t *testing.T) {
	rgbSkin := isSkinRGB(200, 150, 100)
	ycbcrSkin := isSkinYCbCr(200, 150, 100)
	hsvSkin := isSkinHSV(200, 150, 100)
	votes := 0
	if rgbSkin {
		votes++
	}
	if ycbcrSkin {
		votes++
	}
	if hsvSkin {
		votes++
	}
	if votes < 2 {
		t.Errorf("skin tone should get ≥2 votes, got rgb=%v ycbcr=%v hsv=%v", rgbSkin, ycbcrSkin, hsvSkin)
	}
	if !isSkin(200, 150, 100) {
		t.Error("isSkin should return true for skin tone")
	}
}

func TestIsSkin_NonSkin(t *testing.T) {
	if isSkin(0, 0, 255) {
		t.Error("pure blue should not be skin")
	}
	if isSkin(255, 255, 255) {
		t.Error("white should not be skin")
	}
	if isSkin(0, 0, 0) {
		t.Error("black should not be skin")
	}
}

func TestVerifyEyes_NoEyes(t *testing.T) {
	w, h := 50, 50
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		gray[i] = 128
	}
	face := FaceBox{X: 5, Y: 5, Width: 40, Height: 40}
	found, _ := verifyEyes(gray, w, h, face)
	if found {
		t.Error("should not find eyes in uniform gray")
	}
}

func TestFaceSymmetry_Uniform(t *testing.T) {
	w, h := 50, 50
	gray := make([]uint8, w*h)
	for i := 0; i < w*h; i++ {
		gray[i] = 128
	}
	face := FaceBox{X: 5, Y: 5, Width: 40, Height: 40}
	score := faceSymmetry(gray, w, h, face)
	if score < 0.9 {
		t.Errorf("expected high symmetry for uniform image, got %f", score)
	}
}
