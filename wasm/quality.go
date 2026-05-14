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
	canvasScore -= math.Max(0, 38-brightness) * 0.8
	canvasScore -= math.Max(0, brightness-230) * 0.8
	canvasScore -= math.Max(0, 18-contrast) * 1.2
	canvasScore -= math.Max(0, 5-sharpness) * 2.5
	canvasScore -= math.Max(0, float64(35-dynamicRange)) * 0.7
	canvasScore -= glareRatio * 80
	canvasScore -= shadowRatio * 55
	canvasScore -= math.Max(0, float64(400-width)) * 0.03
	canvasScore -= math.Max(0, float64(240-height)) * 0.03
	canvasScore = clampf(canvasScore, 0, 100)

	resolutionScore := math.Min(100.0, float64(width*height)/(900*600)*100)
	brightnessScore := math.Max(0.0, 100.0-absf(brightness-128)/128*100)
	contrastScore := math.Min(100.0, contrast/50*100)
	sharpnessScore := math.Min(100.0, sharpness/SharpnessTypicalMax*100)
	exposureScore := math.Max(0.0, 100.0-darkRatio*80-brightRatio*70-math.Max(0, float64(35-dynamicRange))*0.9)
	qualityScore := round2(resolutionScore*0.20 + brightnessScore*0.22 + contrastScore*0.18 + sharpnessScore*0.22 + exposureScore*0.18)

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
	if m.Width < 320 || m.Height < 200 {
		issues = append(issues, prefix+"_low_resolution")
	}
	if m.QualityScore < 28 {
		issues = append(issues, prefix+"_low_quality")
	}
	if m.Sharpness < 3.0 {
		issues = append(issues, prefix+"_blurry")
	}
	if m.Brightness < 30 || m.Brightness > 230 {
		issues = append(issues, prefix+"_bad_lighting")
	}
	if m.DynamicRange < 22 {
		issues = append(issues, prefix+"_low_dynamic_range")
	}
	if m.GlareRatio > 0.18 {
		issues = append(issues, prefix+"_glare")
	}
	if m.ShadowRatio > 0.55 {
		issues = append(issues, prefix+"_heavy_shadow")
	}
	return issues
}

func BrowserQualityChecks(m QualityMetrics, role string) ([]string, []string) {
	var issues []string
	var blocking []string

	minWidth := 400
	minHeight := 240
	if role == "selfie" {
		minWidth = 280
		minHeight = 280
	}

	if m.Width < minWidth || m.Height < minHeight {
		blocking = append(blocking, "image_resolution_too_low")
	}
	if m.Brightness < 18 || m.ShadowRatio > 0.68 {
		blocking = append(blocking, "image_too_dark")
	} else if m.Brightness < 25 {
		issues = append(issues, "image_dark_but_recoverable")
	} else if m.Brightness < 38 {
		issues = append(issues, "image_slightly_dark")
	}
	if m.Brightness > 245 || m.GlareRatio > 0.25 {
		blocking = append(blocking, "image_overexposed")
	} else if m.GlareRatio > 0.12 || m.BrightPixelRatio > 0.25 {
		issues = append(issues, "image_glare_detected")
	}
	if m.DynamicRange < 18 {
		blocking = append(blocking, "image_low_dynamic_range")
	} else if m.Contrast < 8 || m.DynamicRange < 35 {
		issues = append(issues, "image_low_contrast_recoverable")
	} else if m.Contrast < 14 {
		issues = append(issues, "image_contrast_low")
	}
	if m.Sharpness < 1.8 {
		blocking = append(blocking, "image_blurry")
	} else if m.Sharpness < 5 {
		issues = append(issues, "image_soft_focus")
	}

	return issues, blocking
}
