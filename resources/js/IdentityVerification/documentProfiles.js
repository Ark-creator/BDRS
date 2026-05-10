export const DOCUMENT_TYPES = {
    driver_license: {
        label: "Driver's License",
        dropdown: ["driver's license", 'driver license', 'drivers license'],
        keywords: [
            "driver's license",
            'drivers license',
            'driver license',
            'land transportation office',
            'lto',
            'license no',
            'non-professional',
            'professional driver',
            'restrictions',
        ],
        patterns: [
            /\b[A-Z]\d{2}-\d{2}-\d{5,7}\b/i,
            /\blicen[cs]e\s*(?:no|number)\b/i,
            /\bland\s+transportation\s+office\b/i,
        ],
        idPatterns: [
            /\b[A-Z]\d{2}-\d{2}-\d{5,7}\b/i,
            /\blicen[cs]e\s*(?:no|number)?[:\s-]*([A-Z0-9-]{6,})\b/i,
        ],
    },
    national_id: {
        label: 'National ID',
        dropdown: ['national id', 'philippine identification', 'philid', 'ephilid'],
        keywords: [
            'philippine identification',
            'philid',
            'ephilid',
            'philsys',
            'psn',
            'pcn',
            'pambansang pagkakakilanlan',
        ],
        patterns: [
            /\bphil(?:ippine)?\s+identification\b/i,
            /\bphilid\b/i,
            /\bphilsys\b/i,
            /\b(?:psn|pcn)[:\s-]*\d{4}/i,
        ],
        idPatterns: [
            /\b\d{4}-\d{4}-\d{4}-\d{4}\b/,
            /\b(?:psn|pcn)[:\s-]*([0-9-]{8,})\b/i,
        ],
    },
    passport: {
        label: 'Passport',
        dropdown: ['passport'],
        keywords: [
            'passport',
            'pasaporte',
            'department of foreign affairs',
            'dfa',
            'type p',
            'p<phl',
        ],
        patterns: [
            /\bpassport\b/i,
            /\bpasaporte\b/i,
            /\bp<phl/i,
            /\bdepartment\s+of\s+foreign\s+affairs\b/i,
        ],
        idPatterns: [
            /\b[A-Z][0-9]{7}[A-Z]?\b/,
            /\bpassport\s*(?:no|number)?[:\s-]*([A-Z0-9]{7,10})\b/i,
        ],
    },
    umid: {
        label: 'UMID Card',
        dropdown: ['umid', 'umid card', 'unified multi-purpose id'],
        keywords: [
            'umid',
            'unified multi-purpose id',
            'unified multipurpose id',
            'crn',
            'sss',
            'gsis',
            'pag-ibig',
        ],
        patterns: [
            /\bumid\b/i,
            /\bunified\s+multi[-\s]?purpose\s+id\b/i,
            /\bcrn[:\s-]*\d/i,
        ],
        idPatterns: [
            /\b\d{4}-\d{7}-\d\b/,
            /\bcrn[:\s-]*([0-9-]{8,})\b/i,
        ],
    },
    philhealth_id: {
        label: 'PhilHealth ID',
        dropdown: ['philhealth id', 'philhealth'],
        keywords: [
            'philhealth',
            'philippine health insurance',
            'health insurance corporation',
            'pin',
        ],
        patterns: [
            /\bphilhealth\b/i,
            /\bphilippine\s+health\s+insurance\b/i,
            /\bpin[:\s-]*\d/i,
        ],
        idPatterns: [
            /\b\d{2}-\d{9}-\d\b/,
            /\bpin[:\s-]*([0-9-]{8,})\b/i,
        ],
    },
    postal_id: {
        label: 'Postal ID',
        dropdown: ['postal id', 'postal'],
        keywords: [
            'postal id',
            'phlpost',
            'philippine postal',
            'postal corporation',
        ],
        patterns: [
            /\bpostal\s+id\b/i,
            /\bphlpost\b/i,
            /\bphilippine\s+postal\b/i,
        ],
        idPatterns: [
            /\b[A-Z0-9]{3,4}-[A-Z0-9]{3,4}-[A-Z0-9]{3,4}\b/i,
            /\bpostal\s*(?:id|no|number)?[:\s-]*([A-Z0-9-]{6,})\b/i,
        ],
    },
    voter_id: {
        label: "Voter's ID",
        dropdown: ["voter's id", 'voter id', 'voters id'],
        keywords: [
            "voter's id",
            'voter id',
            'commission on elections',
            'comelec',
            'precinct',
        ],
        patterns: [
            /\bvoter'?s?\s+id\b/i,
            /\bcommission\s+on\s+elections\b/i,
            /\bcomelec\b/i,
            /\bprecinct\b/i,
        ],
        idPatterns: [
            /\b\d{4}-\d{4}[A-Z]?\b/i,
            /\bprecinct[:\s-]*([A-Z0-9-]{4,})\b/i,
        ],
    },
    prc_id: {
        label: 'PRC ID',
        dropdown: ['prc id', 'prc', 'professional regulation commission'],
        keywords: [
            'professional regulation commission',
            'professional identification card',
            'prc',
            'registration no',
        ],
        patterns: [
            /\bprofessional\s+regulation\s+commission\b/i,
            /\bprofessional\s+identification\s+card\b/i,
            /\bprc\b/i,
        ],
        idPatterns: [
            /\b\d{7}\b/,
            /\bregistration\s*(?:no|number)?[:\s-]*([A-Z0-9-]{5,})\b/i,
        ],
    },
    school_id: {
        label: 'School ID',
        dropdown: ['school id', 'student id'],
        keywords: [
            'school id',
            'student id',
            'student number',
            'school year',
            'university',
            'college',
            'institute',
        ],
        patterns: [
            /\bschool\s+id\b/i,
            /\bstudent\s+(?:id|number)\b/i,
            /\bschool\s+year\b/i,
        ],
        idPatterns: [
            /\bstudent\s*(?:id|number)?[:\s-]*([A-Z0-9-]{5,})\b/i,
            /\b\d{2,4}-\d{3,8}\b/,
        ],
    },
    government_id: {
        label: 'Government ID',
        dropdown: ['government id', 'barangay id', 'senior citizen id', 'tin id'],
        keywords: [
            'government id',
            'barangay id',
            'senior citizen',
            'tax identification',
            'tin',
            'government service',
        ],
        patterns: [
            /\bgovernment\s+id\b/i,
            /\bbarangay\s+id\b/i,
            /\bsenior\s+citizen\b/i,
            /\btax\s+identification\b/i,
        ],
        idPatterns: [
            /\b\d{2,4}-\d{2,5}-\d{2,8}\b/,
            /\b(?:tin|id)\s*(?:no|number)?[:\s-]*([A-Z0-9-]{6,})\b/i,
        ],
    },
};

export const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[`'’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const resolveDocumentType = (selectedType) => {
    const selected = normalizeText(selectedType);
    if (!selected) return null;

    return Object.entries(DOCUMENT_TYPES).find(([, profile]) => (
        profile.dropdown.some((label) => selected.includes(normalizeText(label)))
    ))?.[0] || null;
};

export const scoreDocumentType = (rawText, profile) => {
    if (!profile) return 0;
    const normalized = normalizeText(rawText);
    let score = 0;

    for (const keyword of profile.keywords) {
        if (normalized.includes(normalizeText(keyword))) {
            score += keyword.length > 10 ? 24 : 16;
        }
    }

    for (const pattern of profile.patterns) {
        if (pattern.test(rawText)) {
            score += 28;
        }
    }

    return Math.max(0, Math.min(100, score));
};

export const detectDocumentType = (rawText) => {
    const candidates = Object.entries(DOCUMENT_TYPES)
        .map(([type, profile]) => ({ type, label: profile.label, confidence: scoreDocumentType(rawText, profile) }))
        .sort((a, b) => b.confidence - a.confidence);

    const best = candidates[0];
    return best?.confidence >= 24 ? best : null;
};

const cleanLine = (line) => line
    .replace(/[^\w\s.,/#():'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const extractFields = (rawText, selectedType) => {
    const profile = DOCUMENT_TYPES[selectedType];
    const lines = rawText.split(/\r?\n/)
        .map(cleanLine)
        .filter((line) => line.length >= 3);
    const normalizedLines = lines.map(normalizeText);
    const ignoredNameWords = [
        'republic',
        'department',
        'transportation',
        'license',
        'identification',
        'passport',
        'address',
        'nationality',
        'birth',
        'expiry',
        'expiration',
        'signature',
        'blood',
        'sex',
        'height',
        'weight',
    ];

    let idNumber = null;
    for (const pattern of profile?.idPatterns || []) {
        const match = rawText.match(pattern);
        if (match) {
            idNumber = (match[1] || match[0]).trim();
            break;
        }
    }

    const birthdateMatch = rawText.match(/\b(?:19|20)\d{2}[/-]\d{1,2}[/-]\d{1,2}\b/)
        || rawText.match(/\b\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}\b/)
        || rawText.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+(?:19|20)\d{2}\b/i);

    const addressIndex = normalizedLines.findIndex((line) => line.includes('address'));
    const address = addressIndex >= 0
        ? lines.slice(addressIndex + 1, addressIndex + 3).join(' ').trim() || null
        : lines.find((line) => /\b(street|barangay|brgy|city|municipality|province|ave|road|subdivision)\b/i.test(line)) || null;

    const fullName = lines.find((line, index) => {
        const normalized = normalizedLines[index];
        const words = line.split(/\s+/).filter(Boolean);
        if (words.length < 2 || line.length < 7) return false;
        if (/\d/.test(line)) return false;
        if (ignoredNameWords.some((word) => normalized.includes(word))) return false;
        return /[A-Z]{2}/.test(line) || words.length >= 3;
    }) || null;

    return {
        full_name: fullName,
        id_number: idNumber,
        birthdate: birthdateMatch?.[0] || null,
        address,
        id_type: profile?.label || null,
    };
};
