package main

import "testing"

func TestNormalizeText_1dWordBoundary(t *testing.T) {
	tests := []struct{ in, want string }{
		{"bo1d", "bo1d"},
		{"license 1d card", "license id card"},
		{"1d number", "id number"},
		{"lt0 1d office", "lto id office"},
		{"a1dea", "a1dea"},
	}
	for _, tt := range tests {
		got := normalizeText(tt.in)
		if got != tt.want {
			t.Errorf("normalizeText(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}

func TestNormalizeText_SmartQuotes(t *testing.T) {
	got := normalizeText("driver\u2019s license")
	want := "drivers license"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestNormalizeText_OCRArtifacts(t *testing.T) {
	tests := []struct{ in, want string }{
		{"identificati0n card", "identification card"},
		{"philipp1ne id", "philippine id"},
		{"ph1lippine id", "philippine id"},
		{"licen5e no", "license no"},
		{"0ffice of", "office of"},
		{"dr1ver license", "driver license"},
		{"lt0 office", "lto office"},
		{"licence no", "license no"},
	}
	for _, tt := range tests {
		got := normalizeText(tt.in)
		if got != tt.want {
			t.Errorf("normalizeText(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}

func TestNormalizeText_MultiSpaceCollapse(t *testing.T) {
	got := normalizeText("hello   world")
	want := "hello world"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestScoreDocumentType_DriverLicense(t *testing.T) {
	profile := documentProfiles["driver_license"]
	score := scoreDocumentType("land transportation office license no A01-23-456789", profile)
	if score < 24 {
		t.Errorf("expected score >= 24 for driver license text, got %d", score)
	}
}

func TestScoreDocumentType_NoMatch(t *testing.T) {
	profile := documentProfiles["driver_license"]
	score := scoreDocumentType("grocery list eggs milk bread", profile)
	if score != 0 {
		t.Errorf("expected 0 for unrelated text, got %d", score)
	}
}

func TestDetectDocumentType_DriverLicense(t *testing.T) {
	result := DetectDocumentType("Republic of the Philippines Land Transportation Office License No A01-23-456789")
	if result == nil {
		t.Fatal("expected non-nil result")
	}
	if result.Type != "driver_license" {
		t.Errorf("expected driver_license, got %s", result.Type)
	}
}

func TestDetectDocumentType_NoMatch(t *testing.T) {
	result := DetectDocumentType("random text nothing relevant")
	if result != nil {
		t.Errorf("expected nil for no match, got %+v", result)
	}
}

func TestValidateDocument_EmptyText(t *testing.T) {
	result := ValidateDocument("", "driver_license", "front", true)
	if result.Status != "failed" {
		t.Errorf("expected failed for empty text, got %s", result.Status)
	}
}

func TestValidateDocument_NoOcrEngine(t *testing.T) {
	result := ValidateDocument("", "driver_license", "front", false)
	if result.Status != "not_checked" {
		t.Errorf("expected not_checked, got %s", result.Status)
	}
}

func TestValidateDocument_PHID(t *testing.T) {
	result := ValidateDocument(
		"Republic of the Philippines\nLand Transportation Office\nLicense No A01-23-456789\nFirst Name\nLast Name\nDate of Birth\nSex Male\nAddress Manila",
		"driver_license", "front", true,
	)
	if result.Status != "passed" {
		t.Errorf("expected passed, got %s (issues: %v)", result.Status, result.Issues)
	}
	if result.IsIdentityDocument == nil || !*result.IsIdentityDocument {
		t.Error("expected is_identity_document=true")
	}
}

func TestExtractFields_IDNumber(t *testing.T) {
	result := ExtractFields("License No A01-23-456789\nRepublic of the Philippines", "driver_license")
	if result.IDNumber == nil {
		t.Fatal("expected non-nil ID number")
	}
	if *result.IDNumber != "A01-23-456789" {
		t.Errorf("expected A01-23-456789, got %s", *result.IDNumber)
	}
}

func TestExtractFields_Gender(t *testing.T) {
	result := ExtractFields("Sex: Male\nDate of Birth 1990-01-15", "driver_license")
	if result.Gender == nil || *result.Gender != "M" {
		t.Errorf("expected M, got %v", result.Gender)
	}
}

func TestEstimateBarcodeSignal(t *testing.T) {
	w := 200
	h := 300
	rgba := make([]byte, w*h*4)
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			i := (y*w + x) * 4
			v := uint8(0)
			if x%4 < 2 {
				v = 255
			}
			rgba[i] = v
			rgba[i+1] = v
			rgba[i+2] = v
			rgba[i+3] = 255
		}
	}
	result := EstimateBarcodeSignal(rgba, w, h)
	barcodeLike, ok := result["barcode_like"].(bool)
	if !ok || !barcodeLike {
		t.Errorf("expected barcode-like pattern, got %v", result)
	}
}

func TestCollectBackIDEvidence_WithBarcode(t *testing.T) {
	quality := QualityMetrics{
		AspectRatio:  1.6,
		EdgeDensity:  0.05,
		QualityScore: 70,
	}
	result := CollectBackIDEvidence("restrictions conditions", quality, true, 10)
	isValid, _ := result["is_valid"].(bool)
	if !isValid {
		t.Error("expected valid with barcode and markers")
	}
}

func TestCollectBackIDEvidence_AcceptsLowOcr(t *testing.T) {
	quality := QualityMetrics{
		AspectRatio:  1.6,
		EdgeDensity:  0.05,
		QualityScore: 60,
	}
	result := CollectBackIDEvidence("serial 12345", quality, true, 5)
	acceptsLowOcr, _ := result["accepts_low_ocr"].(bool)
	if !acceptsLowOcr {
		t.Error("expected accepts_low_ocr=true when barcodeLike && cardLikeFrame")
	}
}

func TestCollectBackIDEvidence_NoBarcode(t *testing.T) {
	quality := QualityMetrics{AspectRatio: 1.6, EdgeDensity: 0.05, QualityScore: 60}
	result := CollectBackIDEvidence("", quality, false, 5)
	acceptsLowOcr, _ := result["accepts_low_ocr"].(bool)
	if acceptsLowOcr {
		t.Error("expected accepts_low_ocr=false when no barcode")
	}
}

func TestScoreField_SameLineValue(t *testing.T) {
	lines := []string{"Name: Juan Dela Cruz", "Address: Manila"}
	candidate := scoreField(lines, 0, "Name", "text")
	if candidate == nil {
		t.Fatal("expected candidate")
	}
	if candidate.Value != "Juan Dela Cruz" {
		t.Errorf("expected 'Juan Dela Cruz', got %s", candidate.Value)
	}
	if candidate.Score < 30 {
		t.Errorf("expected high score for same-line value, got %f", candidate.Score)
	}
}

func TestScoreField_NoLabel(t *testing.T) {
	lines := []string{"", ""}
	candidate := scoreField(lines, 0, "Name", "text")
	if candidate != nil {
		t.Errorf("expected nil for empty label with no value, got %+v", candidate)
	}
}

func TestParsePHDate_SlashFormat(t *testing.T) {
	tests := []struct {
		in      string
		wantErr bool
	}{
		{"01/15/1990", false},
		{"1/15/1990", false},
		{"1990-01-15", false},
		{"January 15, 1990", false},
		{"Jan 15, 1990", false},
		{"15 January 1990", false},
		{"not a date", true},
	}
	for _, tt := range tests {
		_, err := parsePHDate(tt.in)
		if (err != nil) != tt.wantErr {
			t.Errorf("parsePHDate(%q) error = %v, wantErr %v", tt.in, err, tt.wantErr)
		}
	}
}

func TestValidateExtractedDates_Valid(t *testing.T) {
	birthdate := "01/15/1990"
	expiry := "01/15/2030"
	extraction := FieldExtraction{
		Birthdate:      &birthdate,
		ExpirationDate: &expiry,
	}
	issues := validateExtractedDates(extraction)
	if len(issues) > 0 {
		t.Errorf("expected no issues for valid dates, got %v", issues)
	}
}

func TestValidateExtractedDates_Expired(t *testing.T) {
	birthdate := "01/15/1990"
	expiry := "01/15/2020"
	extraction := FieldExtraction{
		Birthdate:      &birthdate,
		ExpirationDate: &expiry,
	}
	issues := validateExtractedDates(extraction)
	found := false
	for _, iss := range issues {
		if iss == "id_expired" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected id_expired issue, got %v", issues)
	}
}

func TestValidateExtractedDates_FutureBirthdate(t *testing.T) {
	birthdate := "01/15/2090"
	extraction := FieldExtraction{
		Birthdate: &birthdate,
	}
	issues := validateExtractedDates(extraction)
	found := false
	for _, iss := range issues {
		if iss == "birthdate_in_future" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected birthdate_in_future issue, got %v", issues)
	}
}

func TestCheckFieldConsistency_Gender(t *testing.T) {
	gender := "X"
	extraction := FieldExtraction{
		Gender: &gender,
	}
	issues := checkFieldConsistency("", extraction, "")
	found := false
	for _, iss := range issues {
		if iss == "invalid_gender_value" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected invalid_gender_value issue, got %v", issues)
	}
}

func TestCheckFieldConsistency_BirthdateAfterExpiry(t *testing.T) {
	birthdate := "01/15/2025"
	expiry := "01/15/2020"
	extraction := FieldExtraction{
		Birthdate:      &birthdate,
		ExpirationDate: &expiry,
	}
	issues := checkFieldConsistency("", extraction, "")
	found := false
	for _, iss := range issues {
		if iss == "birthdate_after_expiry" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("expected birthdate_after_expiry issue, got %v", issues)
	}
}

func TestExtractFields_ExpirationDate(t *testing.T) {
	result := ExtractFields("License No A01-23-456789\nExpiry: 12/31/2028\nRepublic of the Philippines", "driver_license")
	if result.ExpirationDate == nil {
		t.Fatal("expected non-nil expiration date")
	}
	if *result.ExpirationDate != "12/31/2028" {
		t.Errorf("expected 12/31/2028, got %s", *result.ExpirationDate)
	}
}
