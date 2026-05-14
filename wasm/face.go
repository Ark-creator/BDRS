package main

import "math"

type FaceBox struct {
	X          int     `json:"x"`
	Y          int     `json:"y"`
	Width      int     `json:"width"`
	Height     int     `json:"height"`
	AreaRatio  float64 `json:"area_ratio"`
	Confidence float64 `json:"confidence"`
	Detector   string  `json:"detector"`
}

type FaceDetectionResult struct {
	FaceCount int       `json:"face_count"`
	Faces     []FaceBox `json:"faces"`
	Engine    string    `json:"engine"`
}

func preProcessForFaceDetection(rgba []byte, width, height int) []byte {
	pixelCount := width * height
	if pixelCount == 0 {
		return rgba
	}

	enhanced := make([]byte, len(rgba))
	copy(enhanced, rgba)

	sumLum := 0.0
	minLum := 255.0
	maxLum := 0.0
	for i := 0; i < pixelCount; i++ {
		r := float64(rgba[i*4])
		g := float64(rgba[i*4+1])
		b := float64(rgba[i*4+2])
		lum := 0.299*r + 0.587*g + 0.114*b
		sumLum += lum
		if lum < minLum {
			minLum = lum
		}
		if lum > maxLum {
			maxLum = lum
		}
	}

	avgLum := sumLum / float64(pixelCount)
	dynRange := maxLum - minLum

	var gamma float64 = 1.0
	if avgLum < 55 {
		gamma = 0.55
	} else if avgLum < 80 {
		gamma = 0.7
	} else if avgLum < 110 {
		gamma = 0.85
	}

	var contrastScale float64 = 1.0
	if dynRange < 60 {
		contrastScale = 1.8
	} else if dynRange < 100 {
		contrastScale = 1.4
	} else if dynRange < 150 {
		contrastScale = 1.15
	}

	for i := 0; i < pixelCount; i++ {
		for c := 0; c < 3; c++ {
			val := float64(rgba[i*4+c])
			if gamma != 1.0 {
				normalized := val / 255.0
				corrected := math.Pow(normalized, gamma) * 255.0
				val = corrected
			}
			if contrastScale != 1.0 {
				val = ((val - avgLum) * contrastScale) + avgLum
			}
			if val < 0 {
				val = 0
			}
			if val > 255 {
				val = 255
			}
			enhanced[i*4+c] = byte(val)
		}
		enhanced[i*4+3] = rgba[i*4+3]
	}

	return enhanced
}

func DetectFaces(rgba []byte, width, height int, role string) FaceDetectionResult {
	imageArea := float64(width * height)
	if imageArea == 0 || width < 32 || height < 32 {
		return FaceDetectionResult{Engine: "skin-tone-wasm-go"}
	}

	minAreaRatio := 0.025
	if role == "id" {
		minAreaRatio = 0.006
	}
	minArea := int(float64(width*height) * minAreaRatio)
	if minArea < 120 {
		minArea = 120
	}

	processed := preProcessForFaceDetection(rgba, width, height)

	pixelCount := width * height
	skinMask := make([]bool, pixelCount)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			i := y*width + x
			r := float64(processed[i*4])
			g := float64(processed[i*4+1])
			b := float64(processed[i*4+2])
			maxC := math.Max(r, math.Max(g, b))
			minC := math.Min(r, math.Min(g, b))
			lum := 0.299*r + 0.587*g + 0.114*b

			if lum > 18 && lum < 252 && r > 30 && g > 18 && b > 10 &&
				(maxC-minC) > 6 && (r-g) > -15 && (r-b) > 2 {
				skinMask[i] = true
			}
		}
	}

	visited := make([]bool, pixelCount)
	var components []FaceBox

	for y := 0; y < height; y += 3 {
		for x := 0; x < width; x += 3 {
			startIdx := y*width + x
			if !skinMask[startIdx] || visited[startIdx] {
				continue
			}

			minX, maxX := x, x
			minY, maxY := y, y
			area := 0
			stack := [][2]int{{x, y}}
			visited[startIdx] = true

			for len(stack) > 0 {
				cx, cy := stack[len(stack)-1][0], stack[len(stack)-1][1]
				stack = stack[:len(stack)-1]
				area++

				if cx < minX {
					minX = cx
				}
				if cx > maxX {
					maxX = cx
				}
				if cy < minY {
					minY = cy
				}
				if cy > maxY {
					maxY = cy
				}

				for _, d := range [][2]int{{3, 0}, {-3, 0}, {0, 3}, {0, -3}} {
					nx, ny := cx+d[0], cy+d[1]
					if nx >= 0 && nx < width && ny >= 0 && ny < height {
						nidx := ny*width + nx
						if skinMask[nidx] && !visited[nidx] {
							visited[nidx] = true
							stack = append(stack, [2]int{nx, ny})
						}
					}
				}
			}

			bw := maxX - minX + 1
			bh := maxY - minY + 1
			aspect := float64(bw) / math.Max(1, float64(bh))

			if area >= minArea && aspect >= 0.35 && aspect <= 1.55 {
				areaRatio := float64(bw*bh) / math.Max(1, imageArea)
				centerX := float64(minX) + float64(bw)/2.0
				centerY := float64(minY) + float64(bh)/2.0
				centered := 1.0 - math.Min(1, math.Abs(centerX/float64(width)-0.5)+math.Abs(centerY/float64(height)-0.45))
				confidence := math.Min(100.0, 45.0+areaRatio*280.0+centered*32.0)

				fillRatio := float64(area) / math.Max(1, float64(bw*bh))
				if fillRatio > 0.25 {
					confidence += 8
				}

				components = append(components, FaceBox{
					X:          minX,
					Y:          minY,
					Width:      bw,
					Height:     bh,
					AreaRatio:  round4(areaRatio),
					Confidence: math.Round(clampf(confidence, 0, 100)),
					Detector:   "skin_tone_wasm_go",
				})
			}
		}
	}

	sortFacesByConfidence(components)
	filtered := nmsFaces(components, 0.35)
	if len(filtered) > 3 {
		filtered = filtered[:3]
	}

	return FaceDetectionResult{
		FaceCount: len(filtered),
		Faces:     filtered,
		Engine:    "skin-tone-wasm-go",
	}
}

func sortFacesByConfidence(faces []FaceBox) {
	for i := 1; i < len(faces); i++ {
		for j := i; j > 0 && faces[j].Confidence > faces[j-1].Confidence; j-- {
			faces[j], faces[j-1] = faces[j-1], faces[j]
		}
	}
}

func nmsFaces(faces []FaceBox, threshold float64) []FaceBox {
	var selected []FaceBox
	for _, f := range faces {
		overlap := false
		for _, s := range selected {
			if faceIoU(f, s) > threshold {
				overlap = true
				break
			}
		}
		if !overlap {
			selected = append(selected, f)
		}
	}
	return selected
}

func faceIoU(a, b FaceBox) float64 {
	x1 := math.Max(float64(a.X), float64(b.X))
	y1 := math.Max(float64(a.Y), float64(b.Y))
	x2 := math.Min(float64(a.X+a.Width), float64(b.X+b.Width))
	y2 := math.Min(float64(a.Y+a.Height), float64(b.Y+b.Height))

	interW := math.Max(0, x2-x1)
	interH := math.Max(0, y2-y1)
	inter := interW * interH
	union := float64(a.Width*a.Height) + float64(b.Width*b.Height) - inter
	if union <= 0 {
		return 0
	}
	return inter / union
}
