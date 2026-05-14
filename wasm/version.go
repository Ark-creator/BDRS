package main

import "strconv"

const (
	Major         = 1
	Minor         = 0
	Patch         = 3
	BuildMetadata = "go-wasm"
)

var buildVersion string

func VersionString() string {
	if buildVersion != "" {
		return buildVersion
	}
	return strconv.Itoa(Major) + "." + strconv.Itoa(Minor) + "." + strconv.Itoa(Patch)
}

func FullVersion() map[string]interface{} {
	return map[string]interface{}{
		"version":        VersionString(),
		"major":          Major,
		"minor":          Minor,
		"patch":          Patch,
		"build_metadata": BuildMetadata,
		"engine":         "bdrs-go-wasm-validator",
		"language":       "go",
		"target":         "js/wasm",
	}
}
