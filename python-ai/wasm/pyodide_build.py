from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import urllib.request
from pathlib import Path

PYODIDE_VERSION = "0.26.2"
PYODIDE_URL = (
    f"https://github.com/pyodide/pyodide/releases/download/{PYODIDE_VERSION}/"
    f"pyodide-core-{PYODIDE_VERSION}.tar.bz2"
)
PYODIDE_CACHE_DIR = Path(__file__).parent / ".pyodide"
PYODIDE_DIST_DIR = PYODIDE_CACHE_DIR / "pyodide"
DIST_DIR = Path(__file__).parent / "dist"
WASM_DIR = DIST_DIR

SERVICES: dict[str, list[str]] = {
    "ocr": [
        "app/services/ocr.py",
        "app/services/image_quality.py",
        "app/services/document_types.py",
    ],
    "face": [
        "app/services/face.py",
        "app/services/image_quality.py",
    ],
    "liveness": [
        "app/services/liveness.py",
        "app/services/image_quality.py",
    ],
    "fraud": [
        "app/services/fraud.py",
        "app/services/image_quality.py",
    ],
}


def _download_pyodide() -> Path:
    if PYODIDE_DIST_DIR.exists():
        print(f"Pyodide already cached at {PYODIDE_DIST_DIR}")
        return PYODIDE_DIST_DIR

    PYODIDE_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    tarball = PYODIDE_CACHE_DIR / "pyodide.tar.bz2"
    print(f"Downloading Pyodide {PYODIDE_VERSION}...")
    urllib.request.urlretrieve(PYODIDE_URL, tarball)
    print("Extracting...")
    with tarfile.open(tarball, "r:bz2") as tar:
        tar.extractall(PYODIDE_CACHE_DIR)
    tarball.unlink()
    print(f"Pyodide ready at {PYODIDE_DIST_DIR}")
    return PYODIDE_DIST_DIR


def _build_entry_point(module_name: str, service_deps: list[str]) -> Path:
    entry_src = Path(__file__).parent / f"entry_{module_name}.py"
    if not entry_src.exists():
        raise FileNotFoundError(f"Entry point not found: {entry_src}")

    dist = WASM_DIR / module_name
    dist.mkdir(parents=True, exist_ok=True)

    service_files: list[Path] = []
    root = Path(__file__).parent.parent
    for dep in service_deps:
        src = root / dep
        if src.exists():
            service_files.append(src)

    loader = dist / "loader.mjs"
    loader.write_text(
        _generate_loader_js(module_name, entry_src.read_text(), service_files)
    )

    manifest = {
        "module": module_name,
        "entry": f"entry_{module_name}.py",
        "dependencies": service_deps,
        "pyodide_version": PYODIDE_VERSION,
    }
    (dist / "manifest.json").write_text(json.dumps(manifest, indent=2))

    print(f"  Built {module_name} WASM bundle at {dist}")
    return dist


def _generate_loader_js(
    module_name: str, entry_code: str, service_files: list[Path]
) -> str:
    service_code: dict[str, str] = {}
    for sf in service_files:
        rel = sf.relative_to(sf.parent.parent.parent)
        service_code[str(rel)] = sf.read_text()

    imports = "\n".join(
        f"import {{ {', '.join(_extract_exports(sf))} }} from './{sf.stem}.js';"
        for sf in service_files
        if sf.stem != module_name
    )

    return f"""// Auto-generated loader for {module_name} WASM module
// Built by pyodide_build.py (Pyodide {PYODIDE_VERSION})

const PYODIDE_BASE = '/vendor/bdrs-wasm/pyodide';
const MODULE_NAME = '{module_name}';
const SERVICE_MODULES = {json.dumps(service_code, indent=2)};

let pyodide = null;
let ready = false;

export async function load{dump_module_js(module_name, entry_code)} {{
    if (ready) return;

    const pyodideScript = document.createElement('script');
    pyodideScript.src = `${{PYODIDE_BASE}}/pyodide.js`;
    pyodideScript.onload = async () => {{
        pyodide = await globalThis.loadPyodide({{
            indexURL: `${{PYODIDE_BASE}}/`,
        }});

        for (const [path, code] of Object.entries(SERVICE_MODULES)) {{
            pyodide.FS.writeFile(path, code);
        }}

        pyodide.runPython(`{_escape_python(entry_code)}`);
        ready = true;
    }};
    document.head.appendChild(pyodideScript);
}}

export function isReady() {{
    return ready;
}}
"""


def _extract_exports(path: Path) -> list[str]:
    content = path.read_text()
    exports: list[str] = []
    for line in content.splitlines():
        if line.startswith("def "):
            name = line[4:].split("(")[0].strip()
            if not name.startswith("_"):
                exports.append(name)
    return exports


def _escape_python(code: str) -> str:
    return code.replace("\\", "\\\\").replace("`", "\\`").replace("$", "\\$")


def dump_module_js(name: str, code: str) -> str:
    return name[0].upper() + name[1:]


def build_debug(module_name: str) -> None:
    entry_src = Path(__file__).parent / f"entry_{module_name}.py"
    if entry_src.exists():
        print(f"Debug: entry_{module_name}.py contents:")
        print(entry_src.read_text())


def clean() -> None:
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
        print("Cleaned dist directory")
    wasm_pycache = Path(__file__).parent / "__pycache__"
    if wasm_pycache.exists():
        shutil.rmtree(wasm_pycache)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Build Python AI WASM bundles via Pyodide")
    parser.add_argument("action", choices=["build", "clean", "build-debug"], default="build", nargs="?")
    parser.add_argument("--module", choices=list(SERVICES.keys()) + ["all"], default="all")
    args = parser.parse_args()

    if args.action == "clean":
        clean()
        return

    if args.action == "build-debug":
        modules = list(SERVICES.keys()) if args.module == "all" else [args.module]
        for mod in modules:
            build_debug(mod)
        return

    pyodide_dir = _download_pyodide()
    print(f"Pyodide at {pyodide_dir}")

    modules = list(SERVICES.keys()) if args.module == "all" else [args.module]
    for mod in modules:
        deps = SERVICES[mod]
        _build_entry_point(mod, deps)

    print(f"\nDone. {len(modules)} module(s) built in {DIST_DIR}")


if __name__ == "__main__":
    main()
