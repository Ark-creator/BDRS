import json
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent.parent.parent.parent / "wasm" / "document-types.json"

_doc_types_cache: dict | None = None


def get_document_types():
    global _doc_types_cache
    if _doc_types_cache is None:
        with open(CONFIG_PATH) as f:
            raw = json.load(f)

        result = {}
        for name, cfg in raw.items():
            result[name] = {
                "labels": cfg["detection"]["keywords"],
                "id_patterns": cfg["validation"]["idPatterns"],
            }
        _doc_types_cache = result

    return _doc_types_cache
