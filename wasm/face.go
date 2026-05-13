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
	FaceCount int        `json:"face_count"`
	Faces     []FaceBox  `json:"faces"`
	Engine    string     `json:"engine"`
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

	pixelCount := width * height
	skinMask := make([]bool, pixelCount)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			i := y*width + x
			r := float64(rgba[i*4])
			g := float64(rgba[i*4+1])
			b := float64(rgba[i*4+2])
			maxC := math.Max(r, math.Max(g, b))
			minC := math.Min(r, math.Min(g, b))
			lum := 0.299*r + 0.587*g + 0.114*b

			if lum > 35 && lum < 245 && r > 55 && g > 35 && b > 20 &&
				(maxC-minC) > 12 && (r-g) > -8 && (r-b) > 8 {
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

				if cx < minX { minX = cx }
				if cx > maxX { maxX = cx }
				if cy < minY { minY = cy }
				if cy > maxY { maxY = cy }

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

			if area >= minArea && aspect >= 0.45 && aspect <= 1.25 {
				areaRatio := float64(bw*bh) / math.Max(1, imageArea)
				centerX := float64(minX) + float64(bw)/2.0
				centerY := float64(minY) + float64(bh)/2.0
				centered := 1.0 - math.Min(1, math.Abs(centerX/float64(width)-0.5)+math.Abs(centerY/float64(height)-0.42))
				confidence := math.Min(92, areaRatio*230+centered*45)

				components = append(components, FaceBox{
					X:          minX,
					Y:          minY,
					Width:      bw,
					Height:     bh,
					AreaRatio:  round4(areaRatio),
					Confidence: math.Round(clampf(confidence, 0, 92)),
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
