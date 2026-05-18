const DOCUMENT_TYPES_URL = '/vendor/bdrs-wasm/document-types.json';

let docTypesCache = null;
let docTypesPromise = null;

export async function getDocumentTypes() {
    if (docTypesCache) return docTypesCache;
    if (!docTypesPromise) {
        docTypesPromise = fetch(DOCUMENT_TYPES_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load document types: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                docTypesCache = data;
                return data;
            });
    }
    return docTypesPromise;
}

export function getDocumentTypeSync(typeKey) {
    return docTypesCache?.[typeKey] || null;
}

export function getDocumentTypesSync() {
    return docTypesCache;
}
