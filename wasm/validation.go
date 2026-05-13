package main

import (
	"math"
	"regexp"
	"sort"
	"strings"
	"unicode"
)

type DocumentProfile struct {
	Labels     []string
	IDPatterns []*regexp.Regexp
}

var documentProfiles map[string]DocumentProfile

func init() {
	documentProfiles = map[string]DocumentProfile{
		"driver_license": {
			Labels: []string{
				"driver license", "drivers license", "driver s license",
				"land transportation office", "land transport", "lto",
				"license no", "agency code", "serial number",
				"dl codes", "lto codes", "restrictions", "conditions",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b[A-Z]\d{2}\s*[- ]\s*\d{2}\s*[- ]\s*\d{5,7}\b`),
			},
		},
		"national_id": {
			Labels: []string{
				"philippine identification", "philippine national id",
				"national id", "philsys", "philid", "pcn", "psn",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*\d{4}\b`),
			},
		},
		"umid": {
			Labels: []string{
				"unified multi purpose id", "unified multipurpose id",
				"umid", "common reference no", "crn", "sss", "gsis", "pag ibig", "philhealth",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b\d{4}\s*[- ]\s*\d{7}\s*[- ]\s*\d\b`),
				regexp.MustCompile(`(?i)\b\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*\d{4}\b`),
			},
		},
		"philhealth_id": {
			Labels: []string{
				"philhealth", "philhealth identification", "philhealth insurance",
				"pin", "philippine health insurance corporation",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b\d{2}\s*[- ]\s*\d{9}\s*[- ]\s*\d\b`),
			},
		},
		"postal_id": {
			Labels: []string{
				"postal id", "postal identity card", "phlpost", "philippine postal corporation",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b[A-Z0-9]{3,5}\s*[- ]\s*\d{5,9}\b`),
			},
		},
		"voter_id": {
			Labels: []string{
				"voter", "voter id", "commission on elections", "comelec", "precinct",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b\d{4}\s*[- ]\s*\d{4}\s*[- ]\s*[A-Z0-9]{3,8}\b`),
			},
		},
		"prc_id": {
			Labels: []string{
				"professional regulation commission", "professional identification card",
				"prc", "registration no", "profession",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b\d{6,8}\b`),
			},
		},
		"passport": {
			Labels: []string{
				"passport", "pasaporte", "department of foreign affairs", "dfa",
				"passport no", "issuing authority",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b[A-Z]{1,2}\d{6,8}[A-Z]?\b`),
			},
		},
		"school_id": {
			Labels: []string{
				"school id", "student id", "student number",
				"school year", "university", "college", "institute",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b\d{2,4}\s*[- ]\s*\d{3,8}\b`),
			},
		},
		"government_id": {
			Labels: []string{
				"government id", "tin", "senior citizen", "barangay id",
				"government service", "tax identification",
			},
			IDPatterns: []*regexp.Regexp{
				regexp.MustCompile(`(?i)\b\d{2,4}\s*[- ]\s*\d{2,5}\s*[- ]\s*\d{2,8}\b`),
			},
		},
	}
}

var phMarkers = []string{"republic of the philippines", "philippines", "philippine", "pilipinas", "phl"}
var commonIDMarkers = []string{
	"last name", "first name", "middle name", "date of birth", "birthdate", "dob",
	"sex", "gender", "nationality", "address", "signature", "expiration", "expiry",
	"valid until", "issued", "id no", "id number", "identification number",
	"license no", "passport no", "height", "weight", "blood type",
}
var backIDMarkers = []string{
	"if found", "return to", "emergency contact", "organ donor", "serial number",
	"dl codes", "lto codes", "restrictions", "restriction", "conditions",
	"corrective lenses", "daylight driving", "no hearing aid", "barcode", "qr",
	"magnetic stripe", "signature", "terms and conditions", "this card", "issued by",
	"motorcycle", "vehicle", "gross", "gvw",
}

var datePattern = regexp.MustCompile(`(?i)\b(\d{4}[/-]\d{1,2}[/-]\d{1,2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4})\b`)

type DocumentValidationResult struct {
	Status              string   `json:"status"`
	IsIdentityDocument  *bool    `json:"is_identity_document"`
	IsSupportedDocument *bool    `json:"is_supported_document"`
	DetectedType        *string  `json:"detected_document_type"`
	ExpectedType        *string  `json:"expected_document_type"`
	DocumentSide        string   `json:"document_side"`
	MatchesExpected     *bool    `json:"matches_expected_type"`
	Score               int      `json:"score"`
	Signals             []string `json:"signals"`
	Issues              []string `json:"issues"`
}

type FieldExtraction struct {
	FullName       *string `json:"full_name"`
	Address        *string `json:"address"`
	Birthdate      *string `json:"birthdate"`
	IDNumber       *string `json:"id_number"`
	ExpirationDate *string `json:"expiration_date"`
	Gender         *string `json:"gender"`
	IDType         *string `json:"id_type"`
}

func normalizeText(value string) string {
	value = strings.ToLower(value)
	value = strings.ReplaceAll(value, "'", "")
	value = strings.ReplaceAll(value, "identificati0n", "identification")
	value = strings.ReplaceAll(value, "philipp1ne", "philippine")
	value = strings.ReplaceAll(value, "ph1lippine", "philippine")
	value = strings.ReplaceAll(value, "licen5e", "license")
	value = strings.ReplaceAll(value, "licence", "license")
	value = strings.ReplaceAll(value, "0ffice", "office")
	value = strings.ReplaceAll(value, "dr1ver", "driver")
	value = strings.ReplaceAll(value, "1d", "id")
	value = strings.ReplaceAll(value, "lt0", "lto")
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	value = reg.ReplaceAllString(value, " ")
	value = strings.ReplaceAll(value, "driver s license", "drivers license")
	space := regexp.MustCompile(`\s+`)
	value = space.ReplaceAllString(value, " ")
	return strings.TrimSpace(value)
}

func scoreDocumentType(rawText string, profile DocumentProfile) int {
	normalized := normalizeText(rawText)
	score := 0
	for _, kw := range profile.Labels {
		if strings.Contains(normalized, normalizeText(kw)) {
			if len(kw) > 10 {
				score += 24
			} else {
				score += 16
			}
		}
	}
	for _, pat := range profile.IDPatterns {
		if pat.MatchString(rawText) {
			score += 28
		}
	}
	if score > 100 {
		score = 100
	}
	return score
}

type DocumentTypeCandidate struct {
	Type       string `json:"type"`
	Confidence int    `json:"confidence"`
}

func DetectDocumentType(rawText string) *DocumentTypeCandidate {
	var candidates []DocumentTypeCandidate
	for docType, profile := range documentProfiles {
		score := scoreDocumentType(rawText, profile)
		if score > 0 {
			candidates = append(candidates, DocumentTypeCandidate{Type: docType, Confidence: score})
		}
	}
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Confidence > candidates[j].Confidence
	})
	if len(candidates) == 0 || candidates[0].Confidence < 24 {
		return nil
	}
	return &candidates[0]
}

func ValidateDocument(rawText, expectedType, documentSide string, hasOcrEngine bool) DocumentValidationResult {
	lines := strings.Split(rawText, "\n")
	normalizedText := normalizeText(rawText)

	nilVal := func() *bool { v := false; return &v }

	if len(lines) == 0 || strings.TrimSpace(rawText) == "" {
		if !hasOcrEngine {
			return DocumentValidationResult{
				Status:              "not_checked",
				IsIdentityDocument:  nil,
				IsSupportedDocument: nil,
				DetectedType:        nil,
				ExpectedType:        strPtr(expectedType),
				DocumentSide:        documentSide,
				MatchesExpected:     nil,
				Score:               0,
				Signals:             []string{},
				Issues:              []string{"id_ocr_engine_unavailable"},
			}
		}
		return DocumentValidationResult{
			Status:              "failed",
			IsIdentityDocument:  nilVal(),
			IsSupportedDocument: nilVal(),
			DetectedType:        nil,
			ExpectedType:        strPtr(expectedType),
			DocumentSide:        documentSide,
			MatchesExpected:     nil,
			Score:               0,
			Signals:             []string{},
			Issues:              []string{"id_no_readable_text"},
		}
	}

	phCount := 0
	for _, m := range phMarkers {
		if strings.Contains(normalizedText, m) {
			phCount++
		}
	}
	commonCount := 0
	for _, m := range commonIDMarkers {
		if strings.Contains(normalizedText, m) {
			commonCount++
		}
	}
	backCount := 0
	for _, m := range backIDMarkers {
		if strings.Contains(normalizedText, m) {
			backCount++
		}
	}
	dateMatches := datePattern.FindAllString(rawText, -1)
	dateCount := len(dateMatches)

	var signals []string
	if phCount > 0 {
		signals = append(signals, "philippines_marker")
	}
	if commonCount >= 2 {
		signals = append(signals, "identity_fields")
	}
	if backCount > 0 {
		signals = append(signals, "back_side_fields")
	}
	if dateCount > 0 {
		signals = append(signals, "date_fields")
	}

	profileScores := make(map[string]int)
	for docType, profile := range documentProfiles {
		profileScores[docType] = scoreDocumentType(rawText, profile)
	}

	var detectedType string
	bestScore := 0
	for dt, s := range profileScores {
		if s > bestScore {
			bestScore = s
			detectedType = dt
		}
	}
	if bestScore < 25 {
		detectedType = ""
	}

	score := phCount*15 + minInt(commonCount, 5)*10 + minInt(backCount, 3)*8 + minInt(dateCount, 2)*5
	if detectedType != "" {
		score += profileScores[detectedType]
	}
	if score > 100 {
		score = 100
	}

	hasStrongMarker := bestScore >= 45 || (detectedType != "" && bestScore >= 25 && (phCount >= 1 || commonCount >= 1))

	var isIdentityDoc bool
	if documentSide == "back" {
		isIdentityDoc = (score >= 35 && (commonCount >= 1 || backCount >= 1 || hasStrongMarker)) || backCount >= 2
	} else {
		isIdentityDoc = score >= 40 && (commonCount >= 2 || hasStrongMarker)
	}
	isSupported := isIdentityDoc && detectedType != ""

	matchesExpected := (*bool)(nil)
	if expectedType != "" {
		m := detectedType == expectedType
		matchesExpected = &m
	}

	var issues []string
	if !isIdentityDoc {
		issues = append(issues, "id_not_identity_document")
	} else if !isSupported {
		issues = append(issues, "id_unsupported_document_type")
	} else if matchesExpected != nil && !*matchesExpected {
		issues = append(issues, "id_document_type_mismatch")
	}

	status := "passed"
	if !isSupported || (matchesExpected != nil && !*matchesExpected) {
		status = "failed"
	}

	return DocumentValidationResult{
		Status:              status,
		IsIdentityDocument:  &isIdentityDoc,
		IsSupportedDocument: &isSupported,
		DetectedType:        strPtrSafe(detectedType),
		ExpectedType:        strPtr(expectedType),
		DocumentSide:        documentSide,
		MatchesExpected:     matchesExpected,
		Score:               score,
		Signals:             signals,
		Issues:              issues,
	}
}

func ExtractFields(rawText, selectedType string) FieldExtraction {
	lines := strings.Split(rawText, "\n")
	normalizedLines := make([]string, len(lines))
	for i, l := range lines {
		normalizedLines[i] = normalizeText(l)
	}

	var idNumber *string
	if profile, ok := documentProfiles[selectedType]; ok {
		for _, pat := range profile.IDPatterns {
			if match := pat.FindString(rawText); match != "" {
				cleaned := strings.ToUpper(strings.ReplaceAll(match, " ", ""))
				idNumber = &cleaned
				break
			}
		}
	}

	var birthdate *string
	if match := datePattern.FindString(rawText); match != "" {
		birthdate = &match
	}

	var fullName *string
	ignoredWords := []string{"republic", "department", "transportation", "license", "identification", "passport", "address", "nationality", "birth", "expiry", "expiration", "signature", "blood", "sex", "height", "weight"}
	for i, line := range lines {
		norm := normalizedLines[i]
		words := strings.Fields(line)
		if len(words) < 2 || len(line) < 7 {
			continue
		}
		hasDigit := false
		for _, c := range line {
			if unicode.IsDigit(c) {
				hasDigit = true
				break
			}
		}
		if hasDigit {
			continue
		}
		ignored := false
		for _, w := range ignoredWords {
			if strings.Contains(norm, w) {
				ignored = true
				break
			}
		}
		if ignored {
			continue
		}
		hasUpper := false
		for _, w := range words {
			if len(w) >= 2 && unicode.IsUpper(rune(w[0])) {
				hasUpper = true
				break
			}
		}
		if hasUpper || len(words) >= 3 {
			clean := strings.TrimSpace(line)
			fullName = &clean
			break
		}
	}

	var address *string
	for i, norm := range normalizedLines {
		if strings.Contains(norm, "address") {
			fragments := []string{}
			re := regexp.MustCompile(`(?i)\baddress\b\s*[:#-]?\s*`)
			remainder := strings.TrimSpace(re.ReplaceAllString(lines[i], ""))
			if remainder != "" {
				fragments = append(fragments, remainder)
			}
			for j := i + 1; j < len(lines) && j < i+3; j++ {
				nj := normalizedLines[j]
				if strings.Contains(nj, "license") || strings.Contains(nj, "passport") ||
					strings.Contains(nj, "expiration") || strings.Contains(nj, "date of birth") ||
					strings.Contains(nj, "blood type") {
					break
				}
				fragments = append(fragments, strings.TrimSpace(lines[j]))
			}
			if len(fragments) > 0 {
				joined := strings.TrimSpace(strings.Join(fragments, " "))
				address = &joined
			}
			break
		}
	}

	var gender *string
	genderRe := regexp.MustCompile(`(?i)\b(?:sex|gender)\s*[:#-]?\s*(male|female|m|f)\b`)
	if match := genderRe.FindStringSubmatch(rawText); len(match) >= 2 {
		v := strings.ToUpper(match[1])
		if v == "MALE" {
			v = "M"
		} else if v == "FEMALE" {
			v = "F"
		}
		gender = &v
	}

	var idType *string
	if profile, ok := documentProfiles[selectedType]; ok {
		for _, label := range profile.Labels {
			if len(label) > 3 {
				idType = &label
				break
			}
		}
	}

	return FieldExtraction{
		FullName: fullName,
		Address:  address,
		Birthdate: birthdate,
		IDNumber: idNumber,
		Gender:   gender,
		IDType:   idType,
	}
}

func EstimateBarcodeSignal(rgba []byte, width, height int) map[string]interface{} {
	pixelCount := width * height
	grayscale := make([]uint8, pixelCount)
	for i := 0; i < pixelCount; i++ {
		r := float64(rgba[i*4])
		g := float64(rgba[i*4+1])
		b := float64(rgba[i*4+2])
		grayscale[i] = uint8(clampf(0.299*r+0.587*g+0.114*b, 0, 255))
	}

	yStart := int(float64(height) * 0.32)
	yEnd := int(float64(height) * 0.92)
	xStart := int(float64(width) * 0.08)
	xEnd := int(float64(width) * 0.95)

	transitions := 0
	samples := 0
	highTransitionRows := 0
	rows := 0

	for y := yStart; y < yEnd; y += 2 {
		rowTransitions := 0
		for x := xStart + 1; x < xEnd; x++ {
			idx := y*width + x
			diff := int(grayscale[idx]) - int(grayscale[idx-1])
			if diff < 0 {
				diff = -diff
			}
			if diff > 34 {
				transitions++
				rowTransitions++
			}
			samples++
		}
		rowWidth := math.Max(1, float64(xEnd-xStart))
		if float64(rowTransitions)/rowWidth > 0.10 {
			highTransitionRows++
		}
		rows++
	}

	transitionDensity := float64(transitions) / math.Max(1, float64(samples))
	rowDensity := float64(highTransitionRows) / math.Max(1, float64(rows))

	barcodeLike := transitionDensity >= 0.045 && rowDensity >= 0.18

	return map[string]interface{}{
		"transition_density":       round4(transitionDensity),
		"high_transition_row_ratio": round4(rowDensity),
		"barcode_like":             barcodeLike,
	}
}

func CollectBackIDEvidence(rawText string, quality QualityMetrics, expectedScore int) map[string]interface{} {
	normalized := normalizeText(rawText)
	markerHits := []string{}
	for _, m := range backIDMarkers {
		if strings.Contains(normalized, normalizeText(m)) {
			markerHits = append(markerHits, m)
		}
	}

	serialRe := regexp.MustCompile(`(?i)\bserial\s*(?:number|no)?[:\s-]*\d{5,}\b`)
	digitsRe := regexp.MustCompile(`\b\d{7,12}\b`)
	serialNumberDetected := serialRe.MatchString(rawText) || digitsRe.MatchString(rawText)

	cardLikeFrame := quality.AspectRatio >= 1.20 && quality.AspectRatio <= 2.40 && quality.EdgeDensity >= 0.01
	acceptsLowOcr := false

	isValid := expectedScore >= 12 || len(markerHits) >= 2 || (len(markerHits) >= 1 && serialNumberDetected) || (acceptsLowOcr && len(strings.TrimSpace(rawText)) >= 8) || (acceptsLowOcr && quality.QualityScore >= 58)

	return map[string]interface{}{
		"marker_hits":           markerHits,
		"serial_number_detected": serialNumberDetected,
		"card_like_frame":       cardLikeFrame,
		"accepts_low_ocr":       acceptsLowOcr,
		"is_valid":              isValid,
	}
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func strPtrSafe(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func round3(v float64) float64 {
	return math.Round(v*1000) / 1000
}

func round4(v float64) float64 {
	return math.Round(v*10000) / 10000
}
