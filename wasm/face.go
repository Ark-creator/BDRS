package main

import "math"

const (
	FaceConfidenceBase      = 45.0
	FaceConfidenceAreaCoeff = 280.0
	FaceConfidenceCenterCoeff = 32.0
	FaceFillBonus           = 8.0
	FaceFillThreshold       = 0.25
	EyeVerificationMaxBonus = 20.0
	SymmetryBonus           = 10.0
	SymmetryThreshold       = 0.7
	NoEyeLargeFacePenalty   = 30.0
	LargeFaceAreaThreshold  = 0.05
)

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

func isSkinRGB(r, g, b float64) bool {
	maxC := math.Max(r, math.Max(g, b))
	minC := math.Min(r, math.Min(g, b))
	lum := 0.299*r + 0.587*g + 0.114*b
	return lum > 18 && lum < 252 && r > 30 && g > 18 && b > 10 &&
		(maxC-minC) > 6 && (r-g) > -15 && (r-b) > 2
}

func isSkinYCbCr(r, g, b float64) bool {
	cb := 128 - 0.168736*r - 0.331264*g + 0.5*b
	cr := 128 + 0.5*r - 0.418688*g - 0.081312*b
	return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173
}

func isSkinHSV(r, g, b float64) bool {
	maxC := math.Max(r, math.Max(g, b))
	minC := math.Min(r, math.Min(g, b))
	delta := maxC - minC
	if delta == 0 {
		return false
	}
	var hue float64
	if maxC == r {
		hue = 60 * ((g - b) / delta)
	} else if maxC == g {
		hue = 60 * (2 + (b - r) / delta)
	} else {
		hue = 60 * (4 + (r - g) / delta)
	}
	if hue < 0 {
		hue += 360
	}
	sat := delta / math.Max(1, maxC)
	inHue := (hue > 0 && hue <= 50) || (hue >= 340 && hue < 360)
	return inHue && sat > 0.23 && sat < 0.68
}

func isSkin(r, g, b float64) bool {
	votes := 0
	if isSkinRGB(r, g, b) {
		votes++
	}
	if votes == 0 {
		return false
	}
	if isSkinYCbCr(r, g, b) {
		votes++
	}
	if votes >= 2 {
		return true
	}
	if isSkinHSV(r, g, b) {
		votes++
	}
	return votes >= 2
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
	grayscale := make([]uint8, pixelCount)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			i := y*width + x
			r := float64(processed[i*4])
			g := float64(processed[i*4+1])
			b := float64(processed[i*4+2])

			if isSkin(r, g, b) {
				skinMask[i] = true
			}
			grayscale[i] = uint8(0.299*r + 0.587*g + 0.114*b)
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
				confidence := math.Min(100.0, FaceConfidenceBase+areaRatio*FaceConfidenceAreaCoeff+centered*FaceConfidenceCenterCoeff)

				fillRatio := float64(area) / math.Max(1, float64(bw*bh))
				if fillRatio > FaceFillThreshold {
					confidence += FaceFillBonus
				}

				faceCandidate := FaceBox{
					X:          minX,
					Y:          minY,
					Width:      bw,
					Height:     bh,
					AreaRatio:  round4(areaRatio),
					Confidence: math.Round(clampf(confidence, 0, 100)),
					Detector:   "skin_tone_wasm_go",
				}

				eyesFound, eyeBonus := verifyEyes(grayscale, width, height, faceCandidate)
				symmetry := faceSymmetry(grayscale, width, height, faceCandidate)
				if eyesFound {
					confidence += eyeBonus
				}
				if symmetry > SymmetryThreshold {
					confidence += SymmetryBonus
				}
				if !eyesFound && areaRatio > LargeFaceAreaThreshold {
					confidence -= NoEyeLargeFacePenalty
				}

				faceCandidate.Confidence = math.Round(clampf(confidence, 0, 100))
				components = append(components, faceCandidate)
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

func verifyEyes(gray []uint8, width, height int, face FaceBox) (found bool, confidence float64) {
	if face.Width < 12 || face.Height < 12 {
		return false, 0
	}

	eyeY1 := face.Y
	eyeY2 := face.Y + face.Height/3
	if eyeY2 <= eyeY1 {
		eyeY2 = eyeY1 + 1
	}
	eyeX1 := face.X
	eyeX2 := face.X + face.Width
	if eyeY1 < 0 {
		eyeY1 = 0
	}
	if eyeY2 > height {
		eyeY2 = height
	}
	if eyeX1 < 0 {
		eyeX1 = 0
	}
	if eyeX2 > width {
		eyeX2 = width
	}
	if eyeY1 >= eyeY2 || eyeX1 >= eyeX2 {
		return false, 0
	}

	hist := make([]int, 256)
	for y := eyeY1; y < eyeY2; y++ {
		for x := eyeX1; x < eyeX2; x++ {
			hist[gray[y*width+x]]++
		}
	}

	total := (eyeY2 - eyeY1) * (eyeX2 - eyeX1)
	threshold5 := total * 5 / 100
	cumulative := 0
	darkThreshold := byte(80)
	for i := 0; i < 256; i++ {
		cumulative += hist[i]
		if cumulative >= threshold5 {
			darkThreshold = byte(i)
			break
		}
	}

	type darkRegion struct {
		minX, maxX, minY, maxY, area int
	}
	var regions []darkRegion
	visited := make([]bool, (eyeY2-eyeY1)*(eyeX2-eyeX1))
	for y := eyeY1; y < eyeY2; y++ {
		for x := eyeX1; x < eyeX2; x++ {
			vidx := (y-eyeY1)*(eyeX2-eyeX1) + (x - eyeX1)
			if visited[vidx] || gray[y*width+x] > darkThreshold {
				continue
			}
			rMinX, rMaxX := x, x
			rMinY, rMaxY := y, y
			rArea := 0
			stack := [][2]int{{x, y}}
			visited[vidx] = true

			for len(stack) > 0 {
				cx, cy := stack[len(stack)-1][0], stack[len(stack)-1][1]
				stack = stack[:len(stack)-1]
				rArea++
				if cx < rMinX {
					rMinX = cx
				}
				if cx > rMaxX {
					rMaxX = cx
				}
				if cy < rMinY {
					rMinY = cy
				}
				if cy > rMaxY {
					rMaxY = cy
				}
				for _, d := range [][2]int{{1, 0}, {-1, 0}, {0, 1}, {0, -1}} {
					nx, ny := cx+d[0], cy+d[1]
					if nx >= eyeX1 && nx < eyeX2 && ny >= eyeY1 && ny < eyeY2 {
						nidx := (ny-eyeY1)*(eyeX2-eyeX1) + (nx - eyeX1)
						if !visited[nidx] && gray[ny*width+nx] <= darkThreshold {
							visited[nidx] = true
							stack = append(stack, [2]int{nx, ny})
						}
					}
				}
			}

			rw := rMaxX - rMinX + 1
			rh := rMaxY - rMinY + 1
			if rw >= 2 && rh >= 2 && rArea >= 4 {
				regions = append(regions, darkRegion{rMinX, rMaxX, rMinY, rMaxY, rArea})
			}
		}
	}

	if len(regions) < 2 {
		return false, 0
	}

	faceCenterX := float64(face.X + face.Width/2)
	eyeRegionHeight := float64(eyeY2 - eyeY1)
	bestPairScore := 0.0
	foundPair := false

	for i := 0; i < len(regions); i++ {
		for j := i + 1; j < len(regions); j++ {
			ri := regions[i]
			rj := regions[j]

			areaI := float64(ri.area)
			areaJ := float64(rj.area)
			areaRatio := areaI / math.Max(1, areaJ)
			if areaRatio < 0.6 || areaRatio > 1.67 {
				continue
			}

			cyI := float64(ri.minY+ri.maxY) / 2
			cyJ := float64(rj.minY+rj.maxY) / 2
			yAlign := absf(cyI-cyJ) / math.Max(1, eyeRegionHeight)
			if yAlign > 0.30 {
				continue
			}

			cxI := float64(ri.minX+ri.maxX) / 2
			cxJ := float64(rj.minX+rj.maxX) / 2
			offsetI := absf(cxI - faceCenterX)
			offsetJ := absf(cxJ - faceCenterX)
			symmetry := 1.0 - math.Min(1, absf(offsetI-offsetJ)/math.Max(1, float64(face.Width)*0.25))

			score := areaRatio + (1.0 - yAlign) + symmetry
			if score > bestPairScore {
				bestPairScore = score
				foundPair = true
			}
		}
	}

	if !foundPair {
		return false, 0
	}

	confidence = math.Min(20.0, bestPairScore*6.0)
	return true, confidence
}

func faceSymmetry(gray []uint8, width, height int, face FaceBox) float64 {
	if face.Width < 6 || face.Height < 6 {
		return 0
	}

	midX := face.X + face.Width/2
	leftX := face.X
	rightX := midX
	halfW := rightX - leftX
	if halfW < 2 {
		return 0
	}

	sumDiff := 0.0
	sumMax := 0.0
	count := 0
	for y := face.Y; y < face.Y+face.Height && y < height; y++ {
		for dx := 0; dx < halfW; dx++ {
			lx := leftX + dx
			rx := rightX - 1 - dx
			if lx < 0 || rx >= width {
				continue
			}
			lv := float64(gray[y*width+lx])
			rv := float64(gray[y*width+rx])
			sumDiff += absf(lv - rv)
			sumMax += math.Max(lv, rv)
			count++
		}
	}

	if count == 0 || sumMax == 0 {
		return 0
	}
	return math.Max(0, 1.0-sumDiff/sumMax)
}
