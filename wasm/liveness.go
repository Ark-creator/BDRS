package main

type LivenessResult struct {
	Engine  string                 `json:"engine"`
	Score   float64                `json:"score"`
	Passed  bool                   `json:"passed"`
	Issues  []string               `json:"issues"`
	Signals map[string]interface{} `json:"signals"`
}

func popcount(x uint8) int {
	x -= (x >> 1) & 0x55
	x = (x & 0x33) + ((x >> 2) & 0x33)
	return int((x + (x >> 4)) & 0x0F)
}

func mean8(vals []uint8) float64 {
	sum := 0.0
	for _, v := range vals {
		sum += float64(v)
	}
	return sum / float64(len(vals))
}

func detectMoire(gray []uint8, width, height int, face FaceBox) float64 {
	yStart := face.Y
	yEnd := face.Y + face.Height
	xStart := face.X
	xEnd := face.X + face.Width
	if yStart < 0 {
		yStart = 0
	}
	if yEnd > height {
		yEnd = height
	}
	if xStart < 0 {
		xStart = 0
	}
	if xEnd > width {
		xEnd = width
	}
	if yEnd-yStart < 8 || xEnd-xStart < 8 {
		return 0
	}

	score := 0.0
	rowCount := 0
	for y := yStart; y < yEnd; y += 8 {
		peaks := 0
		for x := xStart + 4; x < xEnd-4; x++ {
			local := mean8(gray[y*width+x-4 : y*width+x+4])
			neighbor := mean8(gray[y*width+x-8 : y*width+x-4])
			if absf(float64(gray[y*width+x])-local) > 15 &&
				absf(float64(gray[y*width+x])-neighbor) > 10 {
				peaks++
			}
		}
		rowWidth := xEnd - xStart - 8
		if rowWidth > 0 && float64(peaks)/float64(rowWidth) > 0.25 {
			score += 1.0
		}
		rowCount++
	}
	if rowCount == 0 {
		return 0
	}
	return score / float64(rowCount) * 100
}

func lbpUniformity(gray []uint8, width, height int, face FaceBox) float64 {
	yStart := face.Y + 1
	yEnd := face.Y + face.Height - 1
	xStart := face.X + 1
	xEnd := face.X + face.Width - 1
	if yStart < 1 {
		yStart = 1
	}
	if yEnd >= height {
		yEnd = height - 1
	}
	if xStart < 1 {
		xStart = 1
	}
	if xEnd >= width {
		xEnd = width - 1
	}
	if yEnd <= yStart || xEnd <= xStart {
		return 50
	}

	uniform := 0
	total := 0
	for y := yStart; y < yEnd; y++ {
		for x := xStart; x < xEnd; x++ {
			center := gray[y*width+x]
			code := uint8(0)
			if gray[(y-1)*width+(x-1)] >= center {
				code |= 1
			}
			if gray[(y-1)*width+x] >= center {
				code |= 2
			}
			if gray[(y-1)*width+(x+1)] >= center {
				code |= 4
			}
			if gray[y*width+(x+1)] >= center {
				code |= 8
			}
			if gray[(y+1)*width+(x+1)] >= center {
				code |= 16
			}
			if gray[(y+1)*width+x] >= center {
				code |= 32
			}
			if gray[(y+1)*width+(x-1)] >= center {
				code |= 64
			}
			if gray[y*width+(x-1)] >= center {
				code |= 128
			}
			transitions := popcount(code ^ (code >> 1))
			if transitions <= 2 {
				uniform++
			}
			total++
		}
	}
	if total == 0 {
		return 50
	}
	return float64(uniform) / float64(total) * 100
}

func histogramBanding(gray []uint8, pixelCount int) float64 {
	hist := make([]int, 256)
	for i := 0; i < pixelCount; i++ {
		hist[gray[i]]++
	}
	emptyBins := 0
	for i := 0; i < 256; i++ {
		if hist[i] == 0 {
			emptyBins++
		}
	}
	return float64(emptyBins)
}

func edgeWidthProfile(gray []uint8, width, height int, face FaceBox) float64 {
	yStart := face.Y
	yEnd := face.Y + face.Height
	xStart := face.X
	xEnd := face.X + face.Width
	if yStart < 0 {
		yStart = 0
	}
	if yEnd > height {
		yEnd = height
	}
	if xStart < 0 {
		xStart = 0
	}
	if xEnd > width {
		xEnd = width
	}
	if yEnd-yStart < 3 || xEnd-xStart < 3 {
		return 3.0
	}

	avgWidth := 0.0
	count := 0
	for y := yStart + 1; y < yEnd-1; y += 2 {
		for x := xStart + 1; x < xEnd-1; x += 2 {
			idx := y*width + x
			dx := absf(float64(gray[idx+1]) - float64(gray[idx-1]))
			dy := absf(float64(gray[idx+width]) - float64(gray[idx-width]))
			grad := dx + dy
			if grad > 40 {
				riseStart := 0.0
				riseEnd := 0.0
				for step := 0; step < 5; step++ {
					nx := x - 2 + step
					if nx < xStart || nx >= xEnd {
						continue
					}
					v := float64(gray[y*width+nx])
					if riseStart == 0 || v < riseStart {
						riseStart = v
					}
					if riseEnd == 0 || v > riseEnd {
						riseEnd = v
					}
				}
				edgeRange := riseEnd - riseStart
				if edgeRange > 20 {
					t10 := riseStart + edgeRange*0.1
					t90 := riseStart + edgeRange*0.9
					w10 := 0.0
					w90 := 0.0
					for step := 0; step < 5; step++ {
						nx := x - 2 + step
						if nx < xStart || nx >= xEnd {
							continue
						}
						v := float64(gray[y*width+nx])
						if v >= t10 && w10 == 0 {
							w10 = float64(step)
						}
						if v >= t90 {
							w90 = float64(step)
						}
					}
					edgeW := w90 - w10
					if edgeW > 0 {
						avgWidth += edgeW
						count++
					}
				}
			}
		}
	}
	if count == 0 {
		return 3.0
	}
	return avgWidth / float64(count)
}

func CheckLiveness(metrics QualityMetrics, gray []uint8, width, height int, faceBox *FaceBox) LivenessResult {
	issues := QualityIssues(metrics, "selfie")
	screenAttackPenalty := 0.0
	if metrics.Contrast < 10 || metrics.Sharpness < 2.5 {
		screenAttackPenalty = 10
	}

	if gray == nil || len(gray) == 0 || faceBox == nil {
		score := metrics.QualityScore - screenAttackPenalty
		score = clampf(score, 0, 98)
		printedRisk := "low"
		if metrics.Sharpness < 2.5 {
			printedRisk = "medium"
		}
		screenRisk := "low"
		if screenAttackPenalty > 0 {
			screenRisk = "medium"
		}
		return LivenessResult{
			Engine: "passive-heuristic-wasm-go",
			Score:  round2(score),
			Passed: score >= 35,
			Issues: issues,
			Signals: map[string]interface{}{
				"printed_photo_risk": printedRisk,
				"screen_replay_risk": screenRisk,
				"quality_score":      metrics.QualityScore,
			},
		}
	}

	moire := detectMoire(gray, width, height, *faceBox)
	lbp := lbpUniformity(gray, width, height, *faceBox)
	banding := histogramBanding(gray, width*height)
	edgeW := edgeWidthProfile(gray, width, height, *faceBox)

	pMoire := clampf((moire-25)/50.0, 0, 1)
	pLBP := clampf((absf(lbp-70)-15)/25.0, 0, 1)
	pBanding := clampf((banding-50)/60.0, 0, 1)
	pEdge := clampf((6-edgeW)/4.0, 0, 1)
	pExisting := 0.0
	if metrics.Contrast < 10 {
		pExisting += 0.4
	}
	if metrics.Sharpness < SharpnessLivenessThreshold {
		pExisting += 0.3
	}
	if pExisting > 1.0 {
		pExisting = 1.0
	}

	weights := []float64{0.25, 0.20, 0.15, 0.15, 0.25}
	signals := []float64{pMoire, pLBP, pBanding, pEdge, pExisting}
	spoofProb := 0.0
	for i, s := range signals {
		spoofProb += s * weights[i]
	}

	score := metrics.QualityScore * (1.0 - spoofProb*0.6)
	score = clampf(score, 0, 98)

	return LivenessResult{
		Engine: "multi-signal-wasm-go",
		Score:  round2(score),
		Passed: spoofProb < 0.40,
		Issues: issues,
		Signals: map[string]interface{}{
			"printed_photo_risk": "low",
			"screen_replay_risk": "low",
			"quality_score":      metrics.QualityScore,
			"moire_energy":       round2(moire),
			"lbp_uniformity":     round2(lbp),
			"histogram_banding":  round2(banding),
			"edge_width_avg":     round2(edgeW),
			"spoof_probability":  round2(spoofProb * 100),
		},
	}
}
