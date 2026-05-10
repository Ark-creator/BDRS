export const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[`'’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const cleanLine = (line) => String(line || '')
    .replace(/[^\w\s.,/#():'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
