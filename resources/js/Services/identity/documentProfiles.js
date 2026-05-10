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
            /\b[A-Z]\d{2}-\d{2}-\d{6}\b/i,
            /\blicen[cs]e\s*(?:no|number)\b/i,
            /\bland\s+transportation\s+office\b/i,
        ],
        idPatterns: [
            /\b[A-Z]\d{2}-\d{2}-\d{6}\b/i,
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
};

export const DOCUMENT_TYPE_OPTIONS = Object.values(DOCUMENT_TYPES).map((profile) => profile.label);
