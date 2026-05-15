package main

type FraudResult struct {
	Engine          string                 `json:"engine"`
	FakeProbability float64                `json:"fake_probability"`
	Issues          []string               `json:"issues"`
	Metadata        map[string]interface{} `json:"metadata"`
}

func AnalyzeFraud(idMetrics, selfieMetrics QualityMetrics, idHash, selfieHash string) FraudResult {
	idIssues := QualityIssues(idMetrics, "id")
	selfieIssues := QualityIssues(selfieMetrics, "selfie")
	var issues []string
	issues = append(issues, idIssues...)
	issues = append(issues, selfieIssues...)

	fakeProbability := 100.0 - (idMetrics.QualityScore*0.70 + selfieMetrics.QualityScore*0.30)

	if idHash != "" && selfieHash != "" && idHash == selfieHash {
		issues = append(issues, "duplicate_id_and_selfie_image")
		fakeProbability += 25
	}
	if idMetrics.Hash == selfieMetrics.Hash {
		issues = append(issues, "duplicate_uploaded_binary")
		fakeProbability += 25
	}

	fakeProbability = clampf(fakeProbability, 0, 100)

	uniqueIssues := uniqueStrings(issues)

	return FraudResult{
		Engine:          "forensic-heuristic-wasm-go",
		FakeProbability: round2(fakeProbability),
		Issues:          uniqueIssues,
		Metadata: map[string]interface{}{
			"id":     idMetrics,
			"selfie": selfieMetrics,
			"hashes": map[string]interface{}{
				"id_image_hash":    idHash,
				"selfie_image_hash": selfieHash,
			},
		},
	}
}

func uniqueStrings(s []string) []string {
	seen := make(map[string]bool)
	var result []string
	for _, v := range s {
		if !seen[v] {
			seen[v] = true
			result = append(result, v)
		}
	}
	return result
}
