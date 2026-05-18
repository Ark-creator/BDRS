.PHONY: python-wasm-build python-wasm-clean python-wasm-build-debug flatbuf flatbuf-clean

PYTHON := python3
FLATC := flatc
FLATBUF_SRC := ../../wasm/shared_schema.fbs
PY_FLATBUF_DIR := flatbuf

flatbuf:
	@which $(FLATC) > /dev/null 2>&1 || (echo "Error: flatc required. Install from https://github.com/google/flatbuffers/releases" && exit 1)
	@mkdir -p $(PY_FLATBUF_DIR)
	$(FLATC) --python -o $(PY_FLATBUF_DIR) $(FLATBUF_SRC)

flatbuf-clean:
	rm -rf $(PY_FLATBUF_DIR)/*

python-wasm-build: flatbuf
	$(PYTHON) pyodide_build.py build

python-wasm-build-debug:
	$(PYTHON) pyodide_build.py build-debug

python-wasm-clean:
	$(PYTHON) pyodide_build.py clean
	rm -rf .pyodide/
