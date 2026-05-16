package main

import (
	_ "embed"
	"encoding/json"
	"regexp"
	"sync"
)

//go:embed document-types.json
var documentTypesJSON []byte

type rawDocumentType struct {
	Label      string           `json:"label"`
	Detection  rawDetection     `json:"detection"`
	Validation rawValidation    `json:"validation"`
}

type rawDetection struct {
	Keywords []string `json:"keywords"`
	Patterns []string `json:"patterns"`
}

type rawValidation struct {
	IDPatterns []string `json:"idPatterns"`
}

var loadDocProfilesOnce sync.Once

func loadDocumentProfiles() (map[string]DocumentProfile, error) {
	var loadErr error
	loadDocProfilesOnce.Do(func() {
		var raw map[string]rawDocumentType
		if err := json.Unmarshal(documentTypesJSON, &raw); err != nil {
			loadErr = err
			return
		}

		result := make(map[string]DocumentProfile, len(raw))
		for name, r := range raw {
			profile := DocumentProfile{
				Labels: r.Detection.Keywords,
			}

			for _, p := range r.Validation.IDPatterns {
				re, err := regexp.Compile(p)
				if err != nil {
					loadErr = err
					return
				}
				profile.IDPatterns = append(profile.IDPatterns, re)
			}

			result[name] = profile
		}

		documentProfiles = result
	})

	return documentProfiles, loadErr
}

func init() {
	_, err := loadDocumentProfiles()
	if err != nil {
		panic(err)
	}
}
