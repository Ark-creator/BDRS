package main

import (
	"crypto/sha256"
	"fmt"
	"math"
)

type QualityMetrics struct {
	Width           int     `json:"width"`
	Height          int     `json:"height"`
	Brightness      float64 `json:"brightness"`
	Contrast        float64 `json:"contrast"`
	Sharpness       float64 `json:"sharpness"`
	DynamicRange    int     `json:"dynamic_range"`
	DarkPixelRatio  float64 `json:"dark_pixel_ratio"`
	BrightPixelRatio float64 `json:"bright_pixel_ratio"`
	GlareRatio      float64 `json:"glare_ratio"`
	ShadowRatio     float64 `json:"shadow_ratio"`
	EdgeDensity     float64 `json:"edge_density"`
	AspectRatio     float64 `json:"aspect_ratio"`
	QualityScore    float64 `json:"quality_score"`
	Sha256          string  `json:"sha256"`
}

func clampf(v, lo, hi float64) float64 {
	return math.Max(lo, math.Min(hi, v))
}

func AnalyzeImageQuality(rgba []byte, width, height int) QualityMetrics {
	pixelCount := width * height
	if pixelCount == 0 {
		return QualityMetrics{}
	}

	grayscale := make([]float64, pixelCount)
	sum := 0.0
	minL := 255.0
	maxL := 0.0
	darkPixels := 0
	brightPixels := 0
	glarePixels := 0
	shadowPixels := 0

	for i := 0; i < pixelCount; i++ {
		r := float64(rgba[i*4])
		g := float64(rgba[i*4+1])
		b := float64(rgba[i*4+2])
		lum := 0.299*r + 0.587*g + 0.114*b
		grayscale[i] = lum
		sum += lum
		if lum < minL {
			minL = lum
		}
		if lum > maxL {
			maxL = lum
		}
		if lum < 28 {
			darkPixels++
		}
		if lum > 242 {
			brightPixels++
		}
		if lum > 248 {
			glarePixels++
		}
		if lum < 22 {
			shadowPixels++
		}
	}

	pixels := float64(pixelCount)
	brightness := sum / pixels

	variance := 0.0
	for i := 0; i < pixelCount; i++ {
		d := grayscale[i] - brightness
		variance += d * d
	}
	contrast := math.Sqrt(variance / pixels)

	gradientTotal := 0.0
	edgePixels := 0
	for y := 1; y < height; y++ {
		for x := 1; x < width; x++ {
			idx := y*width + x
			dx := grayscale[idx] - grayscale[idx-1]
			dy := grayscale[idx] - grayscale[idx-width]
			grad := math.Sqrt(dx*dx + dy*dy)
			gradientTotal += grad
			if grad > 28 {
				edgePixels++
			}
		}
	}

	edgeCount := math.Max(1, float64((width-1)*(height-1)))
	sharpness := gradientTotal / edgeCount
	edgeDensity := float64(edgePixels) / edgeCount

	dynamicRange := int(maxL - minL)
	darkRatio := float64(darkPixels) / pixels
	brightRatio := float64(brightPixels) / pixels
	glareRatio := float64(glarePixels) / pixels
	shadowRatio := float64(shadowPixels) / pixels
	aspectRatio := float64(width) / math.Max(1, float64(height))

	score := 100.0
	score -= math.Max(0, 48-brightness) * 1.2
	score -= math.Max(0, brightness-225) * 1.2
	score -= math.Max(0, 22-contrast) * 1.8
	score -= math.Max(0, 8-sharpness) * 4
	score -= math.Max(0, float64(42-dynamicRange)) * 1.1
	score -= glareRatio * 110
	score -= shadowRatio * 80
	score -= math.Max(0, float64(500-width)) * 0.04
	score -= math.Max(0, float64(280-height)) * 0.04

	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	h := sha256.New()
	h.Write(rgba)
	shaHex := fmt.Sprintf("%x", h.Sum(nil))

	return QualityMetrics{
		Width:            width,
		Height:           height,
		Brightness:       round2(brightness),
		Contrast:         round2(contrast),
		Sharpness:        round2(sharpness),
		DynamicRange:     dynamicRange,
		DarkPixelRatio:   round4(darkRatio),
		BrightPixelRatio: round4(brightRatio),
		GlareRatio:       round4(glareRatio),
		ShadowRatio:      round4(shadowRatio),
		EdgeDensity:      round4(edgeDensity),
		AspectRatio:      round3(aspectRatio),
		QualityScore:     math.Round(clampf(score, 0, 100)),
		Sha256:           shaHex,
	}
}

func QualityIssues(m QualityMetrics, prefix string) []string {
	var issues []string
	if m.Width < 400 || m.Height < 250 {
		issues = append(issues, prefix+"_low_resolution")
	}
	if m.QualityScore < 45 {
		issues = append(issues, prefix+"_low_quality")
	}
	if m.Sharpness < 40 {
		issues = append(issues, prefix+"_blurry")
	}
	if m.Brightness < 45 || m.Brightness > 215 {
		issues = append(issues, prefix+"_bad_lighting")
	}
	if m.DynamicRange < 35 {
		issues = append(issues, prefix+"_low_dynamic_range")
	}
	if m.GlareRatio > 0.10 {
		issues = append(issues, prefix+"_glare")
	}
	if m.ShadowRatio > 0.42 {
		issues = append(issues, prefix+"_heavy_shadow")
	}
	return issues
}

func BrowserQualityChecks(m QualityMetrics, role string) ([]string, []string) {
	var issues []string
	var blocking []string

	minWidth := 500
	minHeight := 280
	if role == "selfie" {
		minWidth = 360
		minHeight = 360
	}

	if m.Width < minWidth || m.Height < minHeight {
		blocking = append(blocking, "image_resolution_too_low")
	}
	if m.Brightness < 28 || m.ShadowRatio > 0.58 {
		blocking = append(blocking, "image_too_dark")
	} else if m.Brightness < 35 {
		issues = append(issues, "image_dark_but_recoverable")
	} else if m.Brightness < 48 {
		issues = append(issues, "image_slightly_dark")
	}
	if m.Brightness > 240 || m.GlareRatio > 0.18 {
		blocking = append(blocking, "image_overexposed")
	} else if m.GlareRatio > 0.08 || m.BrightPixelRatio > 0.20 {
		issues = append(issues, "image_glare_detected")
	}
	if m.DynamicRange < 28 {
		blocking = append(blocking, "image_low_dynamic_range")
	} else if m.Contrast < 12 || m.DynamicRange < 45 {
		issues = append(issues, "image_low_contrast_recoverable")
	} else if m.Contrast < 18 {
		issues = append(issues, "image_contrast_low")
	}
	if m.Sharpness < 3.2 {
		blocking = append(blocking, "image_blurry")
	} else if m.Sharpness < 7 {
		issues = append(issues, "image_soft_focus")
	}

	return issues, blocking
}
