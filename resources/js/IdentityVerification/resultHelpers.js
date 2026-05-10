export const invalidResult = (message, diagnostics, extra = {}) => ({
    status: 'invalid',
    is_valid: false,
    message,
    confidence: diagnostics?.confidence || diagnostics?.quality?.score || 0,
    diagnostics,
    issues: diagnostics?.issues || [],
    ...extra,
});

export const validResult = (message, diagnostics, extra = {}) => ({
    status: 'valid',
    is_valid: true,
    message,
    confidence: diagnostics?.confidence || diagnostics?.quality?.score || 100,
    diagnostics,
    issues: diagnostics?.issues || [],
    ...extra,
});

export const abortError = () => {
    try {
        return new DOMException('Validation was cancelled.', 'AbortError');
    } catch {
        const error = new Error('Validation was cancelled.');
        error.name = 'AbortError';
        return error;
    }
};

export const throwIfAborted = (signal) => {
    if (signal?.aborted) {
        throw abortError();
    }
};

export const compactIssues = (...issueGroups) => Array.from(
    new Set(issueGroups.flat().filter(Boolean))
);
