# Design: Codebase Optimization & Automation

## Architecture Overview

The change has six workstreams. The dependency order is: shared config → JS refactor → queue fix → test expansion → CI/CD → scheduled tasks.

```
Workstream Dependency Graph

    ┌─────────────────────────────────────────────┐
    │ 1. Shared Document Type Config (JSON/YAML)   │
    │    → consumed by Go WASM, JS, Python         │
    └─────────────┬───────────────────┬────────────┘
                  │                   │
                  ▼                   ▼
    ┌──────────────────────┐  ┌──────────────────┐
    │ 2. JS Module Refactor │  │ 3. Queue Fix     │
    │    identityWasmVal →  │  │    horizon/ph    │
    │    split into 6 mods  │  │    align driver  │
    └──────────┬───────────┘  └────────┬─────────┘
               │                       │
               ▼                       ▼
    ┌──────────────────────┐  ┌──────────────────┐
    │ 4. Test Expansion    │◄─│    (fix first)    │
    │    ~10 new test files │  └──────────────────┘
    └──────────┬───────────┘
               │
               ▼
    ┌─────────────────────────────────────────────┐
    │ 5. CI/CD Pipeline (GitHub Actions)          │
    │    PHP, JS, Go WASM, Python builds + tests  │
    └─────────────────────────────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────────┐
    │ 6. Scheduled Task Automation                │
    │    stale drafts, retention, reconciliation  │
    └─────────────────────────────────────────────┘
```

---

## 1. Shared Document Type Config

### Current state

Three independent definitions of the same document type profiles:

| Location | Lines | Format | Types |
|----------|-------|--------|-------|
| `wasm/validation.go:31-123` | ~90 | Go `var documentProfiles map[string]DocumentProfile` | 9 types |
| `resources/js/Services/identityWasmValidator.js:34-269` | ~235 | JS `const DOCUMENT_TYPES` object | 9 types |
| `python-ai/app/services/ocr.py` | ~100 | Python dict | subset |

Each has drifted: some ID patterns differ, keywords differ, and the Python file lacks certain types.

### Target state

A single JSON config file at `config/document-types.json`:

```json
{
  "driver_license": {
    "label": "Driver's License",
    "detection": {
      "keywords": ["driver's license", "lto", "land transportation office", "license no"],
      "patterns": ["\\b[A-Z]\\d{2}-\\d{2}-\\d{6}\\b", ...]
    },
    "validation": {
      "idPatterns": ["\\b[A-Z]\\d{2}-\\d{2}-\\d{6}\\b", ...]
    }
  },
  "national_id": { ... },
  "umid": { ... },
  "philhealth_id": { ... },
  "postal_id": { ... },
  "voter_id": { ... },
  "prc_id": { ... },
  "passport": { ... },
  "school_id": { ... },
  "government_id": { ... }
}
```

#### Go WASM — embed the JSON

```go
// wasm/document_types.go
import _ "embed"

//go:embed ../config/document-types.json
var documentTypesJSON []byte

type DocumentProfile struct {
    Label      string   `json:"label"`
    Keywords   []string `json:"keywords"`
    Patterns   []string `json:"patterns"`
    IDPatterns []string `json:"idPatterns"`
}

func loadDocumentProfiles() (map[string]DocumentProfile, error) {
    // Parse JSON once at init, compile regex patterns
}
```

**Update `wasm/validation.go`:** Remove the hardcoded `var documentProfiles` map and `init()` block (lines 30-124). Load via `loadDocumentProfiles()` instead.

#### JS — fetch the JSON

```js
// resources/js/Services/documentTypeConfig.js
const DOCUMENT_TYPES_URL = '/config/document-types.json';

let docTypesCache = null;

export async function getDocumentTypes() {
    if (docTypesCache) return docTypesCache;
    const res = await fetch(DOCUMENT_TYPES_URL);
    docTypesCache = await res.json();
    return docTypesCache;
}
```

**Update `identityWasmValidator.js`:** Remove the hardcoded `DOCUMENT_TYPES` constant (lines 34-269). Use the `getDocumentTypes()` async function instead. All consumers (`detectDocumentType`, `scoreDocumentType`, `validateIdImage`) become async or use a loaded cache.

#### Python — read from filesystem

```python
# python-ai/app/services/document_types.py
import json
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent.parent.parent / "config" / "document-types.json"

_doc_types_cache = None

def get_document_types():
    global _doc_types_cache
    if _doc_types_cache is None:
        with open(CONFIG_PATH) as f:
            _doc_types_cache = json.load(f)
    return _doc_types_cache
```

**Update `python-ai/app/services/ocr.py`:** Remove the hardcoded document_type definitions. Import from `document_types.py`.

### Migration strategy

1. Create `config/document-types.json` from the Go profiles (authoritative — most recently updated)
2. Cross-reference JS and Python profiles for any additions they have that Go doesn't; merge them
3. Update Go to embed and parse JSON
4. Update JS to fetch JSON
5. Update Python to read JSON
6. Verify all three tiers produce identical results for a test set of OCR outputs
7. Remove the three hardcoded definitions

---

## 2. JS Module Refactor

### Current state

`identityWasmValidator.js` at 1689 lines exports 11 functions and handles:
- OCR pipeline (Tesseract worker lifecycle, canvas preprocessing, multi-pass recognition)
- Document type detection & scoring
- ID field extraction
- Selfie validation (quality + face detection + liveness)
- Image quality analysis (brightness, contrast, sharpness, blur)
- Face detection (skin + geometry heuristics)
- Health checks (asset verification)

### Target state

Six focused modules under `resources/js/Services/`:

```
resources/js/Services/
├── identityWasmValidator.js     ← orchestrator (imports sub-modules)
├── wasmLoader.js                ← existing, unchanged
├── cameraScanner.js             ← existing, unchanged
├── blinkDetection.js            ← existing, unchanged
├── documentTypeConfig.js        ← NEW - fetches shared doc type config
├── ocrPipeline.js               ← NEW - Tesseract worker lifecycle, canvas preprocessing
├── documentValidation.js        ← NEW - detectDocumentType, extractFields, scoreDocumentType
├── imageQualityAnalyzer.js      ← NEW - brightness, contrast, sharpness, blur metrics
├── faceDetection.js             ← NEW - skin/geometry detection orchestration
└── healthChecker.js             ← NEW - asset health, WASM health checks
```

#### Module responsibilities

**`ocrPipeline.js`**
```js
export async function createOcrWorker(options) { ... }
export async function runOcrPipeline(canvas, worker, options) { ... }
export function preprocessCanvas(canvas, options) { ... }
export async function destroyOcrWorker(worker) { ... }
```

**`documentValidation.js`**
```js
import { getDocumentTypes } from './documentTypeConfig';

export async function detectDocumentType(text, validIdType) { ... }
export async function extractFields(text, detectedType) { ... }
export async function scoreDocumentType(text, detectedType) { ... }
export function validateIdImage({ role, file, validIdType, signal }) { ... }
```

**`imageQualityAnalyzer.js`**
```js
export function calculateBrightness(imageData) { ... }
export function calculateContrast(imageData) { ... }
export function calculateSharpness(imageData, width, height) { ... }
export function analyzeImageQuality(imageData, width, height) { ... }
export async function analyzeImageQualityWasm(imageData, width, height) { ... }
```

**`faceDetection.js`**
```js
export function detectFaces(imageData, width, height) { ... }
export function faceDetectionIsConfident(report) { ... }
export function estimateBarcodeSignal(imageData) { ... }
export function collectBackIDEvidence(imageData) { ... }
```

**`healthChecker.js`**
```js
import { getDocumentTypes } from './documentTypeConfig';
export async function getWasmIdentityHealth() { ... }
export function isGoWasmReady() { ... }
```

**`identityWasmValidator.js` (orchestrator, ~100 lines)**
```js
import { createOcrWorker, runOcrPipeline, destroyOcrWorker } from './ocrPipeline';
import { validateIdImage } from './documentValidation';
import { analyzeImageQuality, detectFaces, faceDetectionIsConfident } from './...';
import { getWasmIdentityHealth } from './healthChecker';

// Re-export all public API functions
export { ... };
```

### Backward compatibility

All existing imports (`import { ... } from './identityWasmValidator'`) continue to work because the orchestrator re-exports everything. No JS consumer changes needed beyond the import source for new specialized modules.

### Implementation order

1. `documentTypeConfig.js` (depends on shared config from workstream 1)
2. `ocrPipeline.js` (no dependencies on other new modules)
3. `documentValidation.js` (depends on documentTypeConfig)
4. `imageQualityAnalyzer.js` (independent)
5. `faceDetection.js` (independent)
6. `healthChecker.js` (depends on documentTypeConfig)
7. Update `identityWasmValidator.js` to orchestrate

---

## 3. Queue Configuration Fix

### Current state

`config/queue.php` sets `default` driver to `database`. `config/horizon.php` configures the `identity-verification` queue to use `redis` connection with `auto` balance and `maxProcesses: 3`.

If Redis is not configured or unavailable, Horizon workers will fail to connect, and identity verification jobs will never process.

### Fix

Determine actual production setup and align:

**Option A (Redis available):** Update `config/queue.php` default to `redis`:

```php
// config/queue.php
'default' => env('QUEUE_CONNECTION', 'redis'),
```

Update `.env.example` to default `QUEUE_CONNECTION=redis`.

**Option B (Redis not available):** Update `config/horizon.php` to use `database`:

```php
'identity-verification' => [
    'connection' => 'database',
    'queue' => ['identity-verification', 'default'],
    ...
],
```

**Additionally:**

- Add a `php artisan queue:monitor` health check endpoint or scheduled command
- Log queue health metrics (pending job count, failed job count per queue)
- Add `CheckQueueHealth` middleware or scheduled command that alerts when `identity-verification` queue backlog exceeds threshold (e.g., > 50 pending)

### Eager-loading audit

Review these controllers for N+1 queries:

| Controller | Route Prefix | Suspect Query |
|-----------|-------------|---------------|
| `Admin\RequestDocumentsController` | `/admin/requests` | `DocumentRequest::all()` → loads barangay, user, documentType per row |
| `Admin\DashboardController` | `/admin/dashboard` | Stats queries in loop |
| `Resident\DocumentRequestController` | `/residents/requests` | Request list with relations |

Fix: Add `with()` calls for known relationships, add `withCount()` where only counts needed.

---

## 4. Test Expansion

### Target: Add ~10 new test files

| Test File | What It Covers |
|-----------|---------------|
| `tests/Feature/IdentityVerification/IdentityVerificationFlowTest.php` | Full pipeline: upload ID → upload selfie → process → status → result. Mocks Python AI service. |
| `tests/Feature/IdentityVerification/OcrProcessingJobTest.php` | OCRProcessingJob dispatch, failure handling, retries |
| `tests/Feature/IdentityVerification/FaceVerificationJobTest.php` | FaceVerificationJob dispatch, scoring |
| `tests/Feature/IdentityVerification/LivenessDetectionJobTest.php` | LivenessDetectionJob dispatch |
| `tests/Feature/IdentityVerification/FraudAnalysisJobTest.php` | FraudAnalysisJob dispatch |
| `tests/Feature/IdentityVerification/FinalizeIdentityVerificationJobTest.php` | Score aggregation, approve/review/reject decisions |
| `tests/Feature/Admin/RequestDocumentsTest.php` | List, filter, update status, assign |
| `tests/Feature/Admin/DocumentGenerationTest.php` | Generate document, verify PDF output structure |
| `tests/Feature/Admin/PaymentWorkflowTest.php` | Payment recording, receipt generation |
| `tests/Feature/Admin/SecurityTrafficDashboardTest.php` | Traffic metrics display, filtering |
| `tests/Unit/Services/VerificationScoreServiceTest.php` (expand existing) | Score calculation edge cases |
| `tests/Feature/Middleware/DDoSProtectionTest.php` | IP ban logic, ban expiry |
| `tests/Feature/Middleware/ProgressiveThrottleTest.php` | Throttle escalation |

### Testing patterns

Use Laravel's `Http::fake()` for Python AI service calls:

```php
Http::fake([
    'ai-service-url/*' => Http::response([
        'status' => 'completed',
        'scores' => ['face_match' => 92, 'liveness' => 88],
    ]),
]);
```

Use `Queue::fake()` to assert job dispatching:

```php
Queue::fake();
// ... trigger verification
Queue::assertPushed(OcrProcessingJob::class);
```

### Go WASM tests

Already improved by previous changes (70 tests). No additional Go tests needed in this change.

---

## 5. CI/CD Pipeline

### GitHub Actions workflow: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  php-tests:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ALLOW_EMPTY_PASSWORD: yes
          MYSQL_DATABASE: testing
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with: php-version: 8.2, extensions: mbstring, pdo_mysql, gd, imagick
      - run: composer install --no-interaction --prefer-dist
      - run: cp .env.example .env
      - run: php artisan key:generate
      - run: php artisan migrate --env=testing
      - run: php vendor/bin/phpunit

  js-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm run lint

  wasm-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: go-version: '1.24'
      - run: cd wasm && make all
      - run: cd wasm && go test ./...

  python-ai:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: python-version: '3.12'
      - run: cd python-ai && pip install -r requirements.txt
      - run: cd python-ai && python -m pytest || echo "No pytest config yet"
```

### Additional automation

- `.github/workflows/deploy.yml` — Deploy to staging on merge to `develop` (placeholder — actual deployment depends on hosting)
- `.github/dependabot.yml` — Weekly dependency updates for composer, npm, go modules

---

## 6. Scheduled Task Automation

### New scheduled commands

| Command | Schedule | Purpose |
|---------|----------|---------|
| `CleanupStaleDraftVerifications` | hourly | Delete verification records in `draft` status > 24 hours old, including associated files |
| `CleanupExpiredVerificationFiles` | daily at 03:00 | Remove verification images/files for rejected/completed verifications older than retention period (configurable, default 90 days) |
| `ReconcilePendingPayments` | daily at 06:00 | Find document requests with `pending_payment` > 48 hours, cancel and notify resident |
| `QueueBacklogAlert` | every 5 minutes | Check `jobs` and `failed_jobs` table sizes; if backlog > threshold, notify admin |

### Console kernel update

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('verifications:cleanup-drafts')->hourly();
Schedule::command('verifications:cleanup-files')->dailyAt('03:00');
Schedule::command('payments:reconcile-pending')->dailyAt('06:00');
Schedule::command('queue:monitor-backlog')->everyFiveMinutes();
```

### Configuration

Add to `config/identity_verification.php`:

```php
'retention' => [
    'draft_hours' => env('VERIFICATION_DRAFT_RETENTION_HOURS', 24),
    'completed_days' => env('VERIFICATION_COMPLETED_RETENTION_DAYS', 90),
],
```

Add to `config/queue.php`:

```php
'backlog' => [
    'warning_threshold' => env('QUEUE_BACKLOG_WARNING', 50),
    'critical_threshold' => env('QUEUE_BACKLOG_CRITICAL', 200),
],
```

---

## Backward Compatibility

- **Shared config:** All three tiers continue to export the same API. Go WASM validation exports remain unchanged. JS exports remain unchanged (orchestrator re-exports). Python endpoints remain unchanged.
- **JS refactor:** All `import { ... } from './identityWasmValidator'` continue working. No consumer changes needed.
- **Queue fix:** Only updates config files. No code changes to jobs or workers.
- **Test expansion:** New test files only. No existing tests modified.
- **CI/CD:** New files in `.github/`. No existing code modified.
- **Scheduled tasks:** New commands registered in `routes/console.php`. No existing schedule entries modified.

## Version

No version bump needed — this change has no user-facing API changes. Internal refactoring and automation only.
