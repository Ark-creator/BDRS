package main

import (
	"hash/fnv"
	"math"
)

const (
	SharpnessBlurryThreshold   = 7.0
	SharpnessLivenessThreshold = 5.0
	SharpnessMetricScale       = "gradient-magnitude-average"
	SharpnessTypicalMin        = 3.0
	SharpnessTypicalMax        = 20.0
)

type QualityMetrics struct {
	Width            int     `json:"width"`
	Height           int     `json:"height"`
	Brightness       float64 `json:"brightness"`
	Contrast         float64 `json:"contrast"`
	Sharpness        float64 `json:"sharpness"`
	DynamicRange     int     `json:"dynamic_range"`
	DarkPixelRatio   float64 `json:"dark_pixel_ratio"`
	BrightPixelRatio float64 `json:"bright_pixel_ratio"`
	GlareRatio       float64 `json:"glare_ratio"`
	ShadowRatio      float64 `json:"shadow_ratio"`
	EdgeDensity      float64 `json:"edge_density"`
	AspectRatio      float64 `json:"aspect_ratio"`
	QualityScore     float64 `json:"quality_score"`
	CanvasScore      float64 `json:"canvas_score"`
	Hash             string  `json:"hash"`
}

func clampf(v, lo, hi float64) float64 {
	return math.Max(lo, math.Min(hi, v))
}

func absf(v float64) float64 {
	if v < 0 {
		return -v
	}
	return v
}

func AnalyzeImageQuality(rgba []byte, width, height int) QualityMetrics {
	pixelCount := width * height
	if pixelCount == 0 {
		return QualityMetrics{}
	}

	grayscale := make([]float32, pixelCount)
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
		lum := float32(0.299*r + 0.587*g + 0.114*b)
		grayscale[i] = lum
		lumF := float64(lum)
		sum += lumF
		if lumF < minL {
			minL = lumF
		}
		if lumF > maxL {
			maxL = lumF
		}
		if lumF < 28 {
			darkPixels++
		}
		if lumF > 242 {
			brightPixels++
		}
		if lumF > 248 {
			glarePixels++
		}
		if lumF < 22 {
			shadowPixels++
		}
	}

	pixels := float64(pixelCount)
	brightness := sum / pixels

	variance := 0.0
	for i := 0; i < pixelCount; i++ {
		d := float64(grayscale[i]) - brightness
		variance += d * d
	}
	contrast := math.Sqrt(variance / pixels)

	gradientTotal := 0.0
	edgePixels := 0
	for y := 1; y < height; y++ {
		for x := 1; x < width; x++ {
			idx := y*width + x
			dx := float64(grayscale[idx]) - float64(grayscale[idx-1])
			dy := float64(grayscale[idx]) - float64(grayscale[idx-width])
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

	canvasScore := 100.0
	canvasScore -= math.Max(0, 48-brightness) * 1.2
	canvasScore -= math.Max(0, brightness-225) * 1.2
	canvasScore -= math.Max(0, 22-contrast) * 1.8
	canvasScore -= math.Max(0, 8-sharpness) * 4
	canvasScore -= math.Max(0, float64(42-dynamicRange)) * 1.1
	canvasScore -= glareRatio * 110
	canvasScore -= shadowRatio * 80
	canvasScore -= math.Max(0, float64(500-width)) * 0.04
	canvasScore -= math.Max(0, float64(280-height)) * 0.04
	canvasScore = clampf(canvasScore, 0, 100)

	resolutionScore := math.Min(100.0, float64(width*height)/(900*600)*100)
	brightnessScore := math.Max(0.0, 100.0-absf(brightness-128)/128*100)
	contrastScore := math.Min(100.0, contrast/64*100)
	sharpnessScore := math.Min(100.0, sharpness/SharpnessTypicalMax*100)
	exposureScore := math.Max(0.0, 100.0-darkRatio*110-brightRatio*90-math.Max(0, float64(40-dynamicRange))*1.35)
	qualityScore := round2(resolutionScore*0.25 + brightnessScore*0.18 + contrastScore*0.20 + sharpnessScore*0.27 + exposureScore*0.10)

	h := fnv.New128a()
	h.Write(rgba)
	hashBytes := h.Sum(nil)
	hashHex := make([]byte, len(hashBytes)*2)
	hexChars := []byte("0123456789abcdef")
	for i, b := range hashBytes {
		hashHex[i*2] = hexChars[b>>4]
		hashHex[i*2+1] = hexChars[b&0x0f]
	}

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
		QualityScore:     qualityScore,
		CanvasScore:      math.Round(canvasScore),
		Hash:             string(hashHex),
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
	if m.Sharpness < SharpnessBlurryThreshold {
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
