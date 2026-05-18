import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('./wasmLoader', () => ({
    loadBdrsWasm: vi.fn(),
    analyzeImageQualityGo: vi.fn(),
    analyzeDocumentGeometryGo: vi.fn(),
    detectFacesGo: vi.fn(),
}));

const mockGoWasmApi = {};
const EVENT = 'wasm-pipeline-progress';

function createMockFile() {
    return new File([new Uint8Array([0, 1, 2, 3])], 'test.jpg', { type: 'image/jpeg' });
}

function mockGetContext() {
    const ctxMock = {
        drawImage: vi.fn(),
        getImageData: vi.fn().mockReturnValue({
            data: new Uint8ClampedArray(16),
            width: 2,
            height: 2,
        }),
    };
    HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
        if (type === '2d') return ctxMock;
        return null;
    });
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,/9j/4AAQ==');
    return ctxMock;
}

function mockFetch() {
    globalThis.fetch = vi.fn().mockResolvedValue({
        blob: vi.fn().mockResolvedValue(new Blob([new Uint8Array(4)])),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
    });
}

function mockPythonModules() {
    globalThis.import = vi.fn((url) => {
        if (typeof url === 'string' && url.includes('pyodide')) {
            return Promise.resolve({
                load: vi.fn().mockResolvedValue(undefined),
                extractOcr: vi.fn().mockResolvedValue({
                    status: 'completed',
                    confidence: 95,
                    fields: { name: 'JOHN DOE', id_number: '1234-5678' },
                    document_validation: { is_valid: true },
                }),
                compareFaces: vi.fn().mockResolvedValue({
                    similarity: 90,
                    matched: true,
                    checks: {},
                }),
                checkLiveness: vi.fn().mockResolvedValue({
                    score: 85,
                    passed: true,
                }),
                analyzeFraud: vi.fn().mockResolvedValue({
                    fake_probability: 5,
                    status: 'passed',
                    issues: [],
                }),
            });
        }
        return Promise.reject(new Error(`Unknown module: ${url}`));
    });
}

let wasmLoader;

beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    vi.stubGlobal('SharedArrayBuffer', ArrayBuffer);

    vi.stubGlobal('Image', class {
        constructor() {
            this.naturalWidth = 2;
            this.naturalHeight = 2;
        }
        set src(_url) { if (this.onload) this.onload(); }
    });

    vi.stubGlobal('FileReader', class {
        onload = null;
        readAsDataURL(_blob) {
            this.result = 'data:image/jpeg;base64,';
            if (this.onload) this.onload();
        }
    });

    mockGetContext();
    mockFetch();
    mockPythonModules();

    wasmLoader = await import('./wasmLoader');
    wasmLoader.loadBdrsWasm.mockResolvedValue(mockGoWasmApi);
    wasmLoader.analyzeImageQualityGo.mockResolvedValue({
        is_blurry: false, brightness: 128, contrast: 64,
    });
    wasmLoader.detectFacesGo.mockResolvedValue([
        { x: 10, y: 10, width: 100, height: 100, confidence: 0.95 },
    ]);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

async function importPipeline() {
    return import('./wasmPipeline');
}

describe('wasmPipeline', () => {
    describe('loadGoWasm', () => {
        it('loads Go WASM and dispatches progress events', async () => {
            const pipeline = await importPipeline();
            const events = [];
            window.addEventListener(EVENT, (e) => events.push(e.detail));

            const api = await pipeline.loadGoWasm();

            expect(api).toBe(mockGoWasmApi);
            expect(events.map(e => `${e.step}:${e.status}`)).toEqual([
                'wasm:loading', 'wasm:loaded',
            ]);
        });

        it('dispatches error event on load failure', async () => {
            wasmLoader.loadBdrsWasm.mockRejectedValue(new Error('WASM load failed'));

            const pipeline = await importPipeline();
            const events = [];
            window.addEventListener(EVENT, (e) => events.push(e.detail));

            await expect(pipeline.loadGoWasm()).rejects.toThrow('WASM load failed');

            expect(events.map(e => `${e.step}:${e.status}`)).toEqual([
                'wasm:loading', 'wasm:error',
            ]);
        });

        it('returns cached API on subsequent calls', async () => {
            const pipeline = await importPipeline();
            await pipeline.loadGoWasm();
            const cachedApi = await pipeline.loadGoWasm();

            expect(cachedApi).toBe(mockGoWasmApi);
            expect(wasmLoader.loadBdrsWasm).toHaveBeenCalledTimes(1);
        });
    });

    describe('runPipeline', () => {
        it('runs all 6 pipeline steps with fallback scores when Python WASM unavailable', async () => {
            const pipeline = await importPipeline();
            const result = await pipeline.runPipeline(createMockFile(), createMockFile(), 'driver_license');

            expect(result.document_type).toBe('driver_license');
            expect(result.steps.map(s => s.name)).toEqual([
                'quality', 'face_detection', 'ocr', 'face_compare', 'liveness', 'fraud',
            ]);
            expect(result.scores).toMatchObject({
                face_match: expect.any(Number),
                ocr_confidence: expect.any(Number),
                liveness_score: expect.any(Number),
                fake_probability: expect.any(Number),
                overall_score: expect.any(Number),
            });
            expect(result.scores.overall_score).toBeLessThan(85);
        });

        it('fails early when quality check detects blurry ID', async () => {
            wasmLoader.analyzeImageQualityGo.mockResolvedValue({
                is_blurry: true, brightness: 50, contrast: 20,
            });

            const pipeline = await importPipeline();
            const result = await pipeline.runPipeline(createMockFile(), createMockFile(), 'passport');

            expect(result.status).toBe('failed');
            expect(result.failure_reason).toContain('blurry');
            expect(result.steps.length).toBe(1);
            expect(wasmLoader.detectFacesGo).not.toHaveBeenCalled();
        });

        it('fails early when no face detected in selfie', async () => {
            wasmLoader.detectFacesGo.mockResolvedValue([]);

            const pipeline = await importPipeline();
            const result = await pipeline.runPipeline(createMockFile(), createMockFile(), 'national_id');

            expect(result.status).toBe('failed');
            expect(result.failure_reason).toContain('No face');
            expect(result.steps.length).toBe(2);
            expect(wasmLoader.detectFacesGo).toHaveBeenCalled();
        });

        it('dispatches progress events in correct order', async () => {
            const pipeline = await importPipeline();
            const events = [];
            window.addEventListener(EVENT, (e) => events.push(e.detail));

            await pipeline.runPipeline(createMockFile(), createMockFile(), 'driver_license');

            const statuses = events.map(e => `${e.step}:${e.status}`);
            expect(statuses).toContain('pipeline:starting');
            expect(statuses).toContain('quality:running');
            expect(statuses).toContain('quality:done');
            expect(statuses).toContain('face_detection:running');
            expect(statuses).toContain('face_detection:done');
            expect(statuses).toContain('pipeline:completed');
        });

        it('computes all score components', async () => {
            const pipeline = await importPipeline();
            const result = await pipeline.runPipeline(createMockFile(), createMockFile(), 'driver_license');

            expect(result.scores).toMatchObject({
                face_match: expect.any(Number),
                ocr_confidence: expect.any(Number),
                liveness_score: expect.any(Number),
                fake_probability: expect.any(Number),
                overall_score: expect.any(Number),
            });
        });

        it('overall score is within valid range', async () => {
            const pipeline = await importPipeline();
            const result = await pipeline.runPipeline(createMockFile(), createMockFile(), 'driver_license');

            expect(['approved', 'review_required', 'rejected', 'failed']).toContain(result.status);
            expect(result.scores.overall_score).toBeGreaterThanOrEqual(0);
            expect(result.scores.overall_score).toBeLessThanOrEqual(100);
        });
    });

    describe('isReady', () => {
        it('returns false before Go WASM is loaded', async () => {
            const pipeline = await importPipeline();
            expect(pipeline.isReady()).toBe(false);
        });

        it('returns true after Go WASM is loaded', async () => {
            const pipeline = await importPipeline();
            await pipeline.loadGoWasm();
            expect(pipeline.isReady()).toBe(true);
        });
    });
});
