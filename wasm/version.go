package main

const (
	Major         = 1
	Minor         = 0
	Patch         = 0
	BuildMetadata = "go-wasm"
)

func VersionString() string {
	return "1.0.0"
}

func FullVersion() map[string]interface{} {
	return map[string]interface{}{
		"version":       VersionString(),
		"major":         Major,
		"minor":         Minor,
		"patch":         Patch,
		"build_metadata": BuildMetadata,
		"engine":        "bdrs-go-wasm-validator",
		"language":      "go",
		"target":        "js/wasm",
	}
}
