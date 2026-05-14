package main

import "testing"

func TestVersionString(t *testing.T) {
	v := VersionString()
	if v == "" {
		t.Error("version string should not be empty")
	}
	if v != "1.0.2" {
		t.Errorf("expected 1.0.2, got %s", v)
	}
}

func TestFullVersion(t *testing.T) {
	fv := FullVersion()
	if fv["version"] != VersionString() {
		t.Error("version mismatch")
	}
	if fv["engine"] != "bdrs-go-wasm-validator" {
		t.Errorf("unexpected engine: %v", fv["engine"])
	}
	if fv["language"] != "go" {
		t.Error("expected language=go")
	}
}
