package main

import (
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode"
)

var (
	reNonAlphaNum  = regexp.MustCompile(`[^a-z0-9]+`)
	reMultiSpace   = regexp.MustCompile(`\s+`)
	reAddressLabel = regexp.MustCompile(`(?i)\baddress\b\s*[:#-]?\s*`)
	reGender       = regexp.MustCompile(`(?i)\b(?:sex|gender)\s*[:#-]?\s*(male|female|m|f)\b`)
	reWord1d       = regexp.MustCompile(`\b1d\b`)
	reSerialNumber = regexp.MustCompile(`(?i)\bserial\s*(?:number|no)?[:\s-]*\d{5,}\b`)
	reDigits       = regexp.MustCompile(`\b\d{7,12}\b`)
)

type DocumentProfile struct {
	Labels     []string
	IDPatterns []*regexp.Regexp
}

var documentProfiles map[string]DocumentProfile

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

var frontIDMarkers = []string{
	"last name", "first name", "middle name", "given name", "surname",
	"date of birth", "birthdate", "dob", "born on",
	"sex", "gender", "nationality", "citizenship",
	"height", "weight", "blood type",
	"license no", "license number", "passport no", "passport number",
	"id no", "id number", "identification number",
	"photo", "photograph",
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

type FieldCandidate struct {
	Value    string
	LabelIdx int
	Distance int
	Score    float64
}

func normalizeText(value string) string {
	value = strings.ToLower(value)
	value = strings.ReplaceAll(value, "\u2019", "'")
	value = strings.ReplaceAll(value, "`", "")
	value = strings.ReplaceAll(value, "'", "")
	value = strings.ReplaceAll(value, "identificati0n", "identification")
	value = strings.ReplaceAll(value, "philipp1ne", "philippine")
	value = strings.ReplaceAll(value, "ph1lippine", "philippine")
	value = strings.ReplaceAll(value, "licen5e", "license")
	value = strings.ReplaceAll(value, "licence", "license")
	value = strings.ReplaceAll(value, "0ffice", "office")
	value = strings.ReplaceAll(value, "dr1ver", "driver")
	value = reWord1d.ReplaceAllString(value, "id")
	value = strings.ReplaceAll(value, "lt0", "lto")
	value = reNonAlphaNum.ReplaceAllString(value, " ")
	value = strings.ReplaceAll(value, "driver s license", "drivers license")
	value = reMultiSpace.ReplaceAllString(value, " ")
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
		DetectedType:        strPtr(detectedType),
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
			remainder := strings.TrimSpace(reAddressLabel.ReplaceAllString(lines[i], ""))
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
	if match := reGender.FindStringSubmatch(rawText); len(match) >= 2 {
		v := strings.ToUpper(match[1])
		if v == "MALE" {
			v = "M"
		} else if v == "FEMALE" {
			v = "F"
		}
		gender = &v
	}

	var expirationDate *string
	expPatterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)(?:expir(?:y|ation)|valid until|expires?)\s*[:#-]?\s*(.+)`),
	}
	for _, pat := range expPatterns {
		if match := pat.FindStringSubmatch(rawText); len(match) >= 2 {
			val := strings.TrimSpace(match[1])
			if len(val) > 3 {
				expirationDate = &val
				break
			}
		}
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
		FullName:       fullName,
		Address:        address,
		Birthdate:      birthdate,
		IDNumber:       idNumber,
		ExpirationDate: expirationDate,
		Gender:         gender,
		IDType:         idType,
	}
}

func scoreField(lines []string, labelIdx int, label string, fieldType string) *FieldCandidate {
	if labelIdx < 0 || labelIdx >= len(lines) {
		return nil
	}

	line := lines[labelIdx]
	sepIdx := strings.IndexAny(line, ":-#")
	var value string
	score := 0.0

	if sepIdx >= 0 {
		value = strings.TrimSpace(line[sepIdx+1:])
		score += 20
		if sepIdx > 0 {
			score += 15
		}
	}

	if value == "" && labelIdx+1 < len(lines) {
		for j := labelIdx + 1; j < len(lines) && j <= labelIdx+3; j++ {
			candidate := strings.TrimSpace(lines[j])
			if candidate == "" {
				continue
			}
			norm := normalizeText(candidate)
			isLabel := false
			for _, commonLabel := range []string{"name", "address", "birth", "sex", "gender", "license", "passport", "expiry", "expiration", "signature", "blood", "height", "weight"} {
				if strings.Contains(norm, commonLabel) {
					isLabel = true
					break
				}
			}
			if !isLabel && len(candidate) > 2 {
				if !isLabel {
					score += 10
				}
				value = candidate
				break
			}
		}
	}

	if value == "" {
		return nil
	}

	normValue := normalizeText(value)
	isAnotherLabel := false
	for _, commonLabel := range []string{"name", "address", "birth", "sex", "gender", "license", "passport", "expiry", "expiration", "signature", "blood", "height", "weight", "date of"} {
		if strings.Contains(normValue, commonLabel) {
			isAnotherLabel = true
			break
		}
	}
	if !isAnotherLabel {
		score += 10
	}

	if fieldType == "date" && datePattern.MatchString(value) {
		score += 25
	}

	return &FieldCandidate{
		Value:    value,
		LabelIdx: labelIdx,
		Distance: sepIdx,
		Score:    score,
	}
}

var phDateFormats = []string{
	"01/02/2006",
	"1/2/2006",
	"01-02-2006",
	"1-2-2006",
	"2006-01-02",
	"2006/01/02",
	"January 2, 2006",
	"Jan 2, 2006",
	"2 January 2006",
	"2 Jan 2006",
	"January 2,2006",
	"Jan 2,2006",
}

func parsePHDate(s string) (time.Time, error) {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, ".", "/")

	for _, fmt := range phDateFormats {
		if t, err := time.Parse(fmt, s); err == nil {
			return t, nil
		}
	}

	reMonthDayYear := regexp.MustCompile(`(?i)(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2},?\s+\d{4}`)
	if reMonthDayYear.MatchString(s) {
		parts := strings.Fields(s)
		if len(parts) >= 3 {
			monthStr := strings.TrimSuffix(parts[0], ",")
			dayStr := strings.TrimSuffix(parts[1], ",")
			yearStr := parts[2]
			clean := monthStr + " " + dayStr + " " + yearStr
			for _, fmt := range []string{"January 2 2006", "Jan 2 2006"} {
				if t, err := time.Parse(fmt, clean); err == nil {
					return t, nil
				}
			}
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", s)
}

func validateExtractedDates(extraction FieldExtraction) []string {
	issues := []string{}

	if extraction.Birthdate != nil {
		parsed, err := parsePHDate(*extraction.Birthdate)
		if err != nil {
			issues = append(issues, "birthdate_unparseable")
		} else {
			now := time.Now()
			age := now.Year() - parsed.Year()
			if parsed.After(now.AddDate(0, 0, 1)) {
				issues = append(issues, "birthdate_in_future")
			} else if age > 120 {
				issues = append(issues, "birthdate_implausible")
			}
		}
	}

	if extraction.ExpirationDate != nil {
		parsed, err := parsePHDate(*extraction.ExpirationDate)
		if err != nil {
			issues = append(issues, "expiry_unparseable")
		} else if parsed.Before(time.Now()) {
			issues = append(issues, "id_expired")
		}
	}

	return issues
}

func checkFieldConsistency(rawText string, fieldExtraction FieldExtraction, detectedType string) []string {
	issues := []string{}

	if detectedType != "" && fieldExtraction.IDNumber != nil {
		if profile, ok := documentProfiles[detectedType]; ok {
			matched := false
			for _, pat := range profile.IDPatterns {
				if pat.MatchString(*fieldExtraction.IDNumber) {
					matched = true
					break
				}
			}
			if !matched {
				issues = append(issues, "id_number_pattern_mismatch")
			}
		}
	}

	if fieldExtraction.Gender != nil {
		g := strings.ToUpper(*fieldExtraction.Gender)
		if g != "M" && g != "F" && g != "MALE" && g != "FEMALE" {
			issues = append(issues, "invalid_gender_value")
		}
	}

	if fieldExtraction.Birthdate != nil && fieldExtraction.ExpirationDate != nil {
		birthParsed, bErr := parsePHDate(*fieldExtraction.Birthdate)
		expParsed, eErr := parsePHDate(*fieldExtraction.ExpirationDate)
		if bErr == nil && eErr == nil && birthParsed.After(expParsed) {
			issues = append(issues, "birthdate_after_expiry")
		}
	}

	return issues
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
		"transition_density":        round4(transitionDensity),
		"high_transition_row_ratio": round4(rowDensity),
		"barcode_like":              barcodeLike,
	}
}

func CollectBackIDEvidence(rawText string, quality QualityMetrics, barcodeLike bool, expectedScore int) map[string]interface{} {
	normalized := normalizeText(rawText)
	markerHits := []string{}
	for _, m := range backIDMarkers {
		if strings.Contains(normalized, normalizeText(m)) {
			markerHits = append(markerHits, m)
		}
	}

	frontHits := []string{}
	for _, m := range frontIDMarkers {
		if strings.Contains(normalized, normalizeText(m)) {
			frontHits = append(frontHits, m)
		}
	}

	personalInfoFields := []string{
		"last name", "first name", "middle name", "given name", "surname",
		"date of birth", "birthdate", "dob",
		"sex", "gender", "nationality",
	}
	personalInfoHits := 0
	for _, m := range personalInfoFields {
		if strings.Contains(normalized, m) {
			personalInfoHits++
		}
	}

	isFrontNotBack := personalInfoHits >= 2 || len(frontHits) >= 4

	serialNumberDetected := reSerialNumber.MatchString(rawText) || reDigits.MatchString(rawText)

	cardLikeFrame := quality.AspectRatio >= 1.20 && quality.AspectRatio <= 2.40 && quality.EdgeDensity >= 0.01
	acceptsLowOcr := barcodeLike && cardLikeFrame

	isValid := !isFrontNotBack && (expectedScore >= 12 || len(markerHits) >= 2 || (len(markerHits) >= 1 && serialNumberDetected) || (acceptsLowOcr && len(strings.TrimSpace(rawText)) >= 8) || (acceptsLowOcr && quality.QualityScore >= 58))

	return map[string]interface{}{
		"marker_hits":            markerHits,
		"front_id_hits":          frontHits,
		"personal_info_hits":     personalInfoHits,
		"is_front_not_back":      isFrontNotBack,
		"serial_number_detected": serialNumberDetected,
		"barcode_like":           barcodeLike,
		"card_like_frame":        cardLikeFrame,
		"accepts_low_ocr":        acceptsLowOcr,
		"is_valid":               isValid,
	}
}

func strPtr(s string) *string {
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
