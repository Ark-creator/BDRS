package main

import "math"

type GeometryResult struct {
	BoundaryDetected   bool     `json:"boundary_detected"`
	BoundaryScore      float64  `json:"boundary_score"`
	DocumentAreaRatio  float64  `json:"document_area_ratio"`
	DocumentAspectRatio *float64 `json:"document_aspect_ratio"`
	CroppedRisk        string   `json:"cropped_risk"`
}

func AnalyzeDocumentGeometry(rgba []byte, width, height int) GeometryResult {
	imageArea := float64(width * height)
	empty := GeometryResult{
		CroppedRisk: "unknown",
	}
	if imageArea <= 0 || width < 32 || height < 32 {
		return empty
	}

	pixelCount := width * height
	grayscale := make([]uint8, pixelCount)
	for i := 0; i < pixelCount; i++ {
		r := float64(rgba[i*4])
		g := float64(rgba[i*4+1])
		b := float64(rgba[i*4+2])
		grayscale[i] = uint8(clampf(0.299*r+0.587*g+0.114*b, 0, 255))
	}

	edgeMag := make([]float64, pixelCount)
	for y := 1; y < height-1; y++ {
		for x := 1; x < width-1; x++ {
			idx := y*width + x
			gx := float64(grayscale[idx+1]) - float64(grayscale[idx-1])
			gy := float64(grayscale[idx+width]) - float64(grayscale[idx-width])
			edgeMag[idx] = math.Sqrt(gx*gx + gy*gy)
		}
	}

	edgeThreshold := 30.0
	edgeBinary := make([]bool, pixelCount)
	for i, m := range edgeMag {
		edgeBinary[i] = m > edgeThreshold
	}

	dilate := make([]bool, pixelCount)
	radius := 2
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if !edgeBinary[y*width+x] {
				found := false
				for dy := -radius; dy <= radius && !found; dy++ {
					for dx := -radius; dx <= radius && !found; dx++ {
						ny, nx := y+dy, x+dx
						if ny >= 0 && ny < height && nx >= 0 && nx < width {
							found = edgeBinary[ny*width+nx]
						}
					}
				}
				dilate[y*width+x] = found
			} else {
				dilate[y*width+x] = true
			}
		}
	}

	closed := make([]bool, pixelCount)
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			if dilate[y*width+x] {
				all := true
				for dy := -radius; dy <= radius && all; dy++ {
					for dx := -radius; dx <= radius && all; dx++ {
						ny, nx := y+dy, x+dx
						if ny >= 0 && ny < height && nx >= 0 && nx < width {
							all = dilate[ny*width+nx]
						}
					}
				}
				closed[y*width+x] = all
			}
		}
	}

	visited := make([]bool, pixelCount)
	var bestBox struct{ x1, y1, x2, y2 int }
	bestArea := 0.0
	bestScore := 0.0
	found := false

	for y := 0; y < height; y += 4 {
		for x := 0; x < width; x += 4 {
			if !closed[y*width+x] || visited[y*width+x] {
				continue
			}

			var bx1, by1, bx2, by2 int
			stack := [][2]int{{x, y}}
			visited[y*width+x] = true
			count := 0

			for len(stack) > 0 {
				cx, cy := stack[len(stack)-1][0], stack[len(stack)-1][1]
				stack = stack[:len(stack)-1]
				count++

				if cx < bx1 {
					bx1 = cx
				}
				if cy < by1 {
					by1 = cy
				}
				if cx > bx2 {
					bx2 = cx
				}
				if cy > by2 {
					by2 = cy
				}

				for _, d := range [][2]int{{3, 0}, {-3, 0}, {0, 3}, {0, -3}} {
					nx, ny := cx+d[0], cy+d[1]
					if nx >= 0 && nx < width && ny >= 0 && ny < height && !visited[ny*width+nx] && closed[ny*width+nx] {
						visited[ny*width+nx] = true
						stack = append(stack, [2]int{nx, ny})
					}
				}
			}

			boxW := bx2 - bx1 + 1
			boxH := by2 - by1 + 1
			boxArea := float64(boxW * boxH)
			if boxArea < imageArea*0.06 {
				continue
			}

			areaRatio := boxArea / imageArea
			rectangularity := float64(count) / boxArea
			aspectRatio := float64(boxW) / float64(boxH)

			looksLikeCard := (aspectRatio >= 1.20 && aspectRatio <= 2.35) || (aspectRatio >= 0.42 && aspectRatio <= 0.85)
			hasCardShape := looksLikeCard && rectangularity >= 0.42

			_ = bx1 + bx2 + by1 + by2

			score := math.Min(100, areaRatio*125+rectangularity*32)
			if hasCardShape {
				score += 22
			}
			if areaRatio >= 0.35 && areaRatio <= 0.95 {
				score += 8
			}

			if score > bestScore && hasCardShape && areaRatio >= 0.10 {
				bestScore = score
				bestArea = areaRatio
				bestBox = struct{ x1, y1, x2, y2 int }{bx1, by1, bx2, by2}
				found = true
			}
		}
	}

	if !found {
		return empty
	}

	bw := bestBox.x2 - bestBox.x1 + 1
	bh := bestBox.y2 - bestBox.y1 + 1
	ar := round3(float64(bw) / float64(bh))
	touchesEdge := bestBox.x1 <= 8 || bestBox.y1 <= 8 || bestBox.x2 >= width-8 || bestBox.y2 >= height-8

	_ = touchesEdge
	croppedRisk := "low"
	if touchesEdge {
		croppedRisk = "medium"
	}

	return GeometryResult{
		BoundaryDetected:   true,
		BoundaryScore:      round2(bestScore),
		DocumentAreaRatio:  round3(bestArea),
		DocumentAspectRatio: &ar,
		CroppedRisk:        croppedRisk,
	}
}
