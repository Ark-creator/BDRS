import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectCapabilities, isCapable, resetCache } from './wasmDetect';

const CACHE_KEY = 'bdrs_wasm_capable';

beforeEach(() => {
    resetCache();
    sessionStorage.clear();
    vi.restoreAllMocks();
});

describe('wasmDetect', () => {
    describe('detectCapabilities', () => {
        it('detects all capabilities when WebAssembly, SharedArrayBuffer, and Go probe are available', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await detectCapabilities();

            expect(result.wasm).toBe(true);
            expect(result.sharedArrayBuffer).toBe(true);
            expect(result.goProbe).toBe(true);
            expect(result.capable).toBe(true);
        });

        it('returns not capable when WebAssembly is missing', async () => {
            global.WebAssembly = undefined;
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn();

            const result = await detectCapabilities();

            expect(result.wasm).toBe(false);
            expect(result.sharedArrayBuffer).toBe(true);
            expect(result.goProbe).toBe(false);
            expect(result.capable).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('returns not capable when SharedArrayBuffer is missing', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = undefined;
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await detectCapabilities();

            expect(result.wasm).toBe(true);
            expect(result.sharedArrayBuffer).toBe(false);
            expect(result.goProbe).toBe(true);
            expect(result.capable).toBe(false);
        });

        it('returns not capable when Go WASM probe fails', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockResolvedValue({ ok: false });

            const result = await detectCapabilities();

            expect(result.wasm).toBe(true);
            expect(result.sharedArrayBuffer).toBe(true);
            expect(result.goProbe).toBe(false);
            expect(result.capable).toBe(false);
        });

        it('returns not capable when Go WASM probe throws', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await detectCapabilities();

            expect(result.wasm).toBe(true);
            expect(result.sharedArrayBuffer).toBe(true);
            expect(result.goProbe).toBe(false);
            expect(result.capable).toBe(false);
        });

        it('caches result in sessionStorage', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            await detectCapabilities();
            const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));

            expect(cached.wasm).toBe(true);
            expect(cached.capable).toBe(true);
        });

        it('returns cached result from sessionStorage on subsequent calls without re-fetching', async () => {
            const cachedData = JSON.stringify({ wasm: false, sharedArrayBuffer: false, goProbe: false, capable: false });
            sessionStorage.setItem(CACHE_KEY, cachedData);

            global.fetch = vi.fn();

            const result = await detectCapabilities();

            expect(result.capable).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('recovers from corrupted sessionStorage cache', async () => {
            sessionStorage.setItem(CACHE_KEY, '{invalid json');

            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await detectCapabilities();

            expect(result.capable).toBe(true);
            expect(JSON.parse(sessionStorage.getItem(CACHE_KEY)).capable).toBe(true);
        });

        it('returns cached in-memory result without re-running checks', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            await detectCapabilities();
            const fetchCallsBefore = fetch.mock.calls.length;

            const result = await detectCapabilities();

            expect(result.capable).toBe(true);
            expect(fetch.mock.calls.length).toBe(fetchCallsBefore);
        });
    });

    describe('isCapable', () => {
        it('returns true when all capabilities present', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            const capable = await isCapable();

            expect(capable).toBe(true);
        });

        it('returns false when capabilities missing', async () => {
            global.WebAssembly = undefined;
            global.SharedArrayBuffer = undefined;
            global.fetch = vi.fn();

            const capable = await isCapable();

            expect(capable).toBe(false);
        });
    });

    describe('resetCache', () => {
        it('clears in-memory cache and sessionStorage', async () => {
            global.WebAssembly = { instantiate: vi.fn(), compile: vi.fn() };
            global.SharedArrayBuffer = vi.fn();
            global.fetch = vi.fn().mockResolvedValue({ ok: true });

            await detectCapabilities();
            resetCache();

            expect(sessionStorage.getItem(CACHE_KEY)).toBeNull();

            const result = await detectCapabilities();
            expect(result.capable).toBe(true);
        });
    });
});
