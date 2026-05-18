VERSION := 1.1.0
WASM_NAME := bdrs-validator
DIST := dist
FLATC_VERSION := 24.3.25
GO_SRC := $(wildcard *.go) $(wildcard flatbuf/*.go)

.PHONY: build clean copy-wasm-exec manifest flatbuf flatbuf-check

build: flatbuf $(DIST)/$(WASM_NAME).wasm manifest

$(DIST)/$(WASM_NAME).wasm: $(GO_SRC)
	GOOS=js GOARCH=wasm go build -ldflags="-s -w -X bdrs-wasm-validator.buildVersion=$(VERSION)" -o $@ .

manifest: $(DIST)/wasm-manifest.json config-export

$(DIST)/wasm-manifest.json:
	@mkdir -p $(DIST)
	@echo '{"name":"$(WASM_NAME)","version":"$(VERSION)","engine":"bdrs-go-wasm-validator","language":"go","target":"js/wasm","files":["$(WASM_NAME).wasm","wasm_loader.js","document-types.json"]}' > $@

$(DIST)/document-types.json: document-types.json
	cp $< $@

config-export: $(DIST)/document-types.json

copy-wasm-exec:
	cp "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" $(DIST)/wasm_exec.js

# ── Flatbuffers ──

FLATC := flatc
FLATBUF_SRC := shared_schema.fbs
GO_FLATBUF_DIR := flatbuf

flatbuf-check:
	@which $(FLATC) > /dev/null 2>&1 || (echo "Error: flatc $(FLATC_VERSION)+ required. Install from https://github.com/google/flatbuffers/releases/tag/v$(FLATC_VERSION)" && exit 1)

flatbuf: flatbuf-check $(GO_FLATBUF_DIR)/pipeline/PipelineResult.go

$(GO_FLATBUF_DIR)/pipeline/PipelineResult.go: $(FLATBUF_SRC)
	@mkdir -p $(GO_FLATBUF_DIR)
	$(FLATC) --go -o $(GO_FLATBUF_DIR) $(FLATBUF_SRC)

clean: clean-flatbuf

clean-flatbuf:
	rm -rf $(GO_FLATBUF_DIR)/pipeline/

all: clean build copy-wasm-exec
