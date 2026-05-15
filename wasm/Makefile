VERSION := 1.1.0
WASM_NAME := bdrs-validator
DIST := dist
GO_SRC := $(wildcard *.go)

.PHONY: build clean copy-wasm-exec manifest

build: $(DIST)/$(WASM_NAME).wasm manifest

$(DIST)/$(WASM_NAME).wasm: $(GO_SRC)
	GOOS=js GOARCH=wasm go build -ldflags="-s -w -X bdrs-wasm-validator.buildVersion=$(VERSION)" -o $@ .

manifest: $(DIST)/wasm-manifest.json

$(DIST)/wasm-manifest.json:
	@mkdir -p $(DIST)
	@echo '{"name":"$(WASM_NAME)","version":"$(VERSION)","engine":"bdrs-go-wasm-validator","language":"go","target":"js/wasm","files":["$(WASM_NAME).wasm","wasm_loader.js"]}' > $@

copy-wasm-exec:
	cp "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" $(DIST)/wasm_exec.js

clean:
	rm -rf $(DIST)/*

all: clean build copy-wasm-exec
