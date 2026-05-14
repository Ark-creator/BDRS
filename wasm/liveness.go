package main

type LivenessResult struct {
	Engine  string                 `json:"engine"`
	Score   float64                `json:"score"`
	Passed  bool                   `json:"passed"`
	Issues  []string               `json:"issues"`
	Signals map[string]interface{} `json:"signals"`
}

func CheckLiveness(metrics QualityMetrics) LivenessResult {
	issues := QualityIssues(metrics, "selfie")
	screenAttackPenalty := 0.0
	if metrics.Contrast < 10 || metrics.Sharpness < 2.5 {
		screenAttackPenalty = 10
	}
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
			"printed_photo_risk":  printedRisk,
			"screen_replay_risk":  screenRisk,
			"quality_score":       metrics.QualityScore,
		},
	}
}
