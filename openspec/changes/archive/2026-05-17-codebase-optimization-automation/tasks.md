# Tasks: Codebase Optimization & Automation

## Phase 1: Shared Document Type Config

### Task 1.1: Create shared document-types.json
**Files:** `config/document-types.json`
**Estimate:** 30 min
**Depends on:** None

- [x] Create `config/document-types.json` with all 10 document type profiles
- [x] Source the authoritative data from `wasm/validation.go` `documentProfiles` map (lines 31-123)
- [x] Cross-reference with JS `DOCUMENT_TYPES` in `identityWasmValidator.js` (lines 34-269) — add any missing keywords/patterns
- [x] Cross-reference with Python `python-ai/app/services/ocr.py` — add any missing profiles
- [x] Ensure all regex patterns use JSON-escaped format (double backslashes)
- [x] Validate JSON structure against a known-correct schema

### Task 1.2: Update Go WASM to embed shared config
**Files:** `wasm/document_types.go` (new), `wasm/validation.go` (remove old doc profiles)
**Estimate:** 30 min
**Depends on:** Task 1.1

- [x] Create `wasm/document_types.go`:
  - `//go:embed document-types.json` directive
  - Raw structs matching JSON schema
  - `loadDocumentProfiles()` function that JSON-unmarshal and compiles regex patterns once
  - `init()` to lazy-load on startup
- [x] Remove the hardcoded `documentProfiles` map and `init()` block from `wasm/validation.go`
- [x] Move JSON to `wasm/document-types.json`, symlink `config/document-types.json` → `../wasm/document-types.json`
- [x] Run `go test ./...` in `wasm/` — verify all existing tests pass

### Task 1.3: Update JS to fetch shared config
**Files:** `resources/js/Services/documentTypeConfig.js` (new), `resources/js/Services/identityWasmValidator.js` (modify)
**Estimate:** 30 min
**Depends on:** Task 1.1

- [x] Create `resources/js/Services/documentTypeConfig.js`:
  - `getDocumentTypes()` async function that fetches `/vendor/bdrs-wasm/document-types.json`
  - Cache with module-level variable
  - `getDocumentTypeSync()` for callers that can't be async (returns cached or null)
- [x] Update `identityWasmValidator.js`:
  - Remove `DOCUMENT_TYPES` constant
  - Import `getDocumentTypes` and `getDocumentTypeSync`
  - Update `resolveDocumentType` to be async
  - Update `scoreDocumentType`, `detectDocumentType`, `extractFields` to use `getDocumentTypes()`
  - Update `validateIdImage` to use `getDocumentTypes()`
- [x] Update Makefile to export config to dist directory
- [x] Copy config to `public/vendor/bdrs-wasm/document-types.json` for HTTP serving
- [x] Verify `npm run build` compiles without errors

### Task 1.4: Update Python to read shared config
**Files:** `python-ai/app/services/document_types.py` (new), `python-ai/app/services/ocr.py` (modify)
**Estimate:** 20 min
**Depends on:** Task 1.1

- [x] Create `python-ai/app/services/document_types.py`:
  - `get_document_types()` with caching
  - Read JSON from `wasm/document-types.json` relative to project root
- [x] Update `ocr.py` — remove hardcoded `DOCUMENT_PROFILES` dict, import from `document_types.py`
- [x] Verify Python syntax is valid

### Task 1.5: Verify cross-tier consistency
**Files:** — (verification only)
**Estimate:** 20 min
**Depends on:** Tasks 1.2, 1.3, 1.4

- [x] Go WASM: `go test ./...` passes (all 70+ tests), confirming Go loads and uses shared config
- [x] JS: `npm run build` succeeds, confirming JS can use shared config module
- [x] Python: syntax verified, module loads correctly with 10 types
- [x] Structural verification: all 10 types have keywords, patterns, and idPatterns
- [x] No inconsistencies found across tiers

---

## Phase 2: JS Module Refactor

### Task 2.1: Create ocrPipeline.js
**Files:** `resources/js/Services/ocrPipeline.js` (new), `resources/js/Services/identityWasmValidator.js` (extract)
**Estimate:** 45 min
**Depends on:** None (independent)

- [ ] Extract these into `ocrPipeline.js`:
  - `getOcrWorker` → `createOcrWorker(options)`
  - `loadCanvas` + `enhanceCanvas` → canvas preprocessing
  - `mergeOcrResults` + `runOcr` → `runOcrPipeline`
  - `destroyOcrWorker(worker)`
- [ ] Maintain all existing parameters and behavior
- [ ] Export only the public functions; keep helpers private

### Task 2.2: Create documentValidation.js
**Files:** `resources/js/Services/documentValidation.js` (new), `resources/js/Services/identityWasmValidator.js` (extract)
**Estimate:** 40 min
**Depends on:** Task 1.3 (uses documentTypeConfig)

- [ ] Extract into `documentValidation.js`:
  - `detectDocumentType(text, validIdType)`
  - `scoreDocumentType(text, detectedType)`
  - `extractFields(text, detectedType)`
  - `validateIdImage({ role, file, validIdType, signal })`
- [ ] Import `getDocumentTypes` from `./documentTypeConfig`
- [ ] Export all 4 functions
- [ ] Re-export from `identityWasmValidator.js` to maintain public API

### Task 2.3: Create imageQualityAnalyzer.js
**Files:** `resources/js/Services/imageQualityAnalyzer.js` (new), `resources/js/Services/identityWasmValidator.js` (extract)
**Estimate:** 25 min
**Depends on:** None (independent)

- [ ] Extract into `imageQualityAnalyzer.js`:
  - `calculateBrightness`, `calculateContrast`, `calculateSharpness`
  - `determineGlare`, `detectBlur`
  - `analyzeImageQuality(imageData, width, height)` — orchestrator
  - `analyzeImageQualityWasm(imageData, width, height)` — WASM bridge
- [ ] Export all functions

### Task 2.4: Create faceDetection.js
**Files:** `resources/js/Services/faceDetection.js` (new), `resources/js/Services/identityWasmValidator.js` (extract)
**Estimate:** 20 min
**Depends on:** None (independent)

- [ ] Extract into `faceDetection.js`:
  - `detectFaces(imageData, width, height)`
  - `faceDetectionIsConfident(report)`
  - `estimateBarcodeSignal(imageData)`
  - `collectBackIDEvidence(imageData)`
- [ ] Export all functions

### Task 2.5: Create healthChecker.js
**Files:** `resources/js/Services/healthChecker.js` (new), `resources/js/Services/identityWasmValidator.js` (extract)
**Estimate:** 15 min
**Depends on:** None (independent)

- [ ] Extract into `healthChecker.js`:
  - `isGoWasmReady()`
  - `getWasmIdentityHealth()`
- [ ] Export both functions

### Task 2.6: Update identityWasmValidator.js as orchestrator
**Files:** `resources/js/Services/identityWasmValidator.js` (simplify)
**Estimate:** 20 min
**Depends on:** Tasks 2.1, 2.2, 2.3, 2.4, 2.5

- [ ] Convert `identityWasmValidator.js` to an orchestrator file that:
  - Imports from the 6 sub-modules
  - Re-exports all public functions
  - Keeps only cross-cutting orchestration logic (e.g., `validateRegistrationImageWasm`)
- [ ] Target: ~100 lines
- [ ] Verify `npm run build` compiles without errors
- [ ] Verify all imports from `./identityWasmValidator` in other files still work

---

## Phase 3: Queue Configuration & Data Fetching Fix

### Task 3.1: Align queue driver configuration
**Files:** `config/queue.php`, `config/horizon.php`, `.env.example`
**Estimate:** 15 min
**Depends on:** None

- [x] Check `.env.example`: `QUEUE_CONNECTION=database` — database is the configured driver
- [x] Update `config/horizon.php`: change `identity-verification` connection from `redis` to `database`
- [x] Update `config/horizon.php` `waits` keys from `redis:*` to `database:*`
- [x] Horizon and queue config now aligned (both use `database` driver)

### Task 3.2: Add queue health monitoring
**Files:** `app/Console/Commands/CheckQueueBacklog.php` (new), `routes/console.php` (modify)
**Estimate:** 20 min
**Depends on:** None

- [x] Create `app/Console/Commands/CheckQueueBacklog.php`:
  - Queries `jobs` table count for `identity-verification` queue
  - Queries `failed_jobs` count
  - Logs warning if total > 50, critical if > 200
  - Returns FAILURE/SUCCESS exit codes
- [ ] Register in `routes/console.php`: `Schedule::command('queue:monitor-backlog')->everyFiveMinutes();`

### Task 3.3: Fix N+1 queries in admin controllers
**Files:** `app/Http/Controllers/Admin/RequestDocumentsController.php`, `app/Http/Controllers/Admin/DashboardController.php`, `app/Http/Controllers/Resident/DocumentRequestController.php`
**Estimate:** 25 min
**Depends on:** None

- [x] Audit `RequestDocumentsController`: `claimByVoucher()` missing `with(['user.profile'])` — fixed
- [x] Audit `DashboardController`: all relationships properly eager-loaded — no issues found
- [x] Audit `Resident/DocumentRequestController`: `$pastRequests` missing `user.profile` — fixed
- [ ] Verify with Laravel Debugbar or query log that N+1 is eliminated

---

## Phase 4: Test Expansion

### Task 4.1: Add Identity Verification pipeline test
**Files:** `tests/Feature/IdentityVerification/IdentityVerificationFlowTest.php`
**Estimate:** 40 min
**Depends on:** None

- [ ] Test full pipeline: create Verification via API, assert queued jobs
- [ ] Test each status transition: draft → queued → processing → approved/rejected/review_required
- [ ] Mock Python AI service responses using `Http::fake()`
- [ ] Test error handling: AI service timeout, invalid image, missing data
- [ ] Test score aggregation: verify approve_min, review_min thresholds

### Task 4.2: Add Identity Verification job tests
**Files:** `tests/Feature/IdentityVerification/OcrProcessingJobTest.php`, `tests/Feature/IdentityVerification/FaceVerificationJobTest.php`, `tests/Feature/IdentityVerification/LivenessDetectionJobTest.php`, `tests/Feature/IdentityVerification/FraudAnalysisJobTest.php`, `tests/Feature/IdentityVerification/FinalizeIdentityVerificationJobTest.php`
**Estimate:** 60 min
**Depends on:** Task 4.1 (shares test setup)

- [ ] Test `OCRProcessingJob`: dispatch, success, failure, retry logic
- [ ] Test `FaceVerificationJob`: face match scoring, confidence calculation
- [ ] Test `LivenessDetectionJob`: liveness scoring
- [ ] Test `FraudAnalysisJob`: fraud detection logic
- [ ] Test `FinalizeIdentityVerificationJob`: score aggregation, decision logic (approve/review/reject)
- [ ] Use `Queue::fake()` and `Bus::fake()` to isolate job testing

### Task 4.3: Add admin workflow tests
**Files:** `tests/Feature/Admin/RequestDocumentsTest.php`, `tests/Feature/Admin/DocumentGenerationTest.php`, `tests/Feature/Admin/PaymentWorkflowTest.php`
**Estimate:** 50 min
**Depends on:** None

- [ ] Test `RequestDocumentsController`:
  - List with filters (status, barangay, date range)
  - Update request status
  - Assign to user
- [ ] Test `DocumentGenerationController`:
  - Generate document for approved request
  - Verify PDF/Word output structure (file exists, non-empty)
  - Test permission checks
- [ ] Test `PaymentController`:
  - Record payment for a request
  - Generate receipt
  - Payment status transitions

### Task 4.4: Add middleware tests
**Files:** `tests/Feature/Middleware/DDoSProtectionTest.php`, `tests/Feature/Middleware/ProgressiveThrottleTest.php`
**Estimate:** 25 min
**Depends on:** None

- [ ] Test `DDoSProtection` middleware:
  - IP ban after threshold exceeded
  - Ban expiry after timeout
  - Whitelisted IPs bypass ban
- [ ] Test `ProgressiveThrottle` middleware:
  - Requests under threshold pass normally
  - Requests over threshold get progressively limited
  - Strict limit enforced after critical threshold

### Task 4.5: Expand VerificationScoreService unit tests
**Files:** `tests/Unit/Services/VerificationScoreServiceTest.php`
**Estimate:** 20 min
**Depends on:** None

- [ ] Add tests for edge cases:
  - All scores at minimum (all zeros)
  - Face match below threshold but OCR high → review
  - Liveness fails → reject
  - Fraud detected → reject
  - All scores perfect → approve
  - Some scores null/missing
- [ ] Test config-driven threshold values are respected

---

## Phase 5: CI/CD Pipeline

### Task 5.1: Create GitHub Actions CI workflow
**Files:** `.github/workflows/ci.yml`
**Estimate:** 30 min
**Depends on:** None

- [ ] Create PHP tests job:
  - Setup PHP 8.2 with required extensions
  - MySQL 8.0 service container
  - Install composer deps, copy .env, generate key, migrate
  - Run `vendor/bin/phpunit`
- [ ] Create JS build job:
  - Setup Node 20, npm ci
  - Run `npm run build`
  - Run `npm run lint`
- [ ] Create WASM build job:
  - Setup Go 1.24
  - Run `make all` in `wasm/`
  - Run `go test ./...` in `wasm/`
- [ ] Create Python AI job:
  - Setup Python 3.12
  - Install pip deps
  - Verify service can start (basic smoke test)

### Task 5.2: Create Dependabot configuration
**Files:** `.github/dependabot.yml`
**Estimate:** 5 min
**Depends on:** None

- [ ] Add weekly composer dependency check
- [ ] Add weekly npm dependency check
- [ ] Add weekly Go module check
- [ ] Add weekly Python pip check

### Task 5.3: Add optional deploy workflow placeholder
**Files:** `.github/workflows/deploy.yml`
**Estimate:** 10 min
**Depends on:** None

- [ ] Create placeholder deploy workflow triggered on push to `main`
- [ ] Add steps for: checkout, install deps, build assets, run migrations (placeholder — actual deploy depends on hosting provider)
- [ ] Add comment documenting integration points for SSH/deployer/Forge/etc.

---

## Phase 6: Scheduled Task Automation

### Task 6.1: Create cleanup commands
**Files:** `app/Console/Commands/CleanupStaleDraftVerifications.php` (new), `app/Console/Commands/CleanupExpiredVerificationFiles.php` (new)
**Estimate:** 25 min
**Depends on:** None

- [x] Create `CleanupStaleDraftVerifications`:
  - Finds draft records older than retention hours, deletes associated files
  - Respects configurable retention hours
- [x] Create `CleanupExpiredVerificationFiles`:
  - Finds terminal status records (approved/rejected/failed) past retention period
  - Nullifies file paths after deleting, respects configurable retention days

### Task 6.2: Create payment reconciliation command
**Files:** `app/Console/Commands/ReconcilePendingPayments.php` (new)
**Estimate:** 15 min
**Depends on:** None

- [x] Create `ReconcilePendingPayments`:
  - Cancels DocumentRequests stuck in `Pending Payment` for > 48 hours

### Task 6.3: Register scheduled tasks
**Files:** `routes/console.php`
**Estimate:** 10 min
**Depends on:** Tasks 6.1, 6.2, 3.2

- [x] Add all 4 scheduled commands to `routes/console.php`
- [x] Preserve existing `CleanupTemporaryFilesJob` schedule

### Task 6.4: Add configuration for retention and backlog settings
**Files:** `config/identity_verification.php`, `config/queue.php`
**Estimate:** 10 min
**Depends on:** Tasks 6.1, 3.2

- [x] Add `retention` config to `config/identity_verification.php`
- [x] Add `backlog` config to `config/queue.php`

---

## Summary

| Phase | Tasks | Total Est. |
|-------|-------|-----------|
| Phase 1: Shared Config | 1.1, 1.2, 1.3, 1.4, 1.5 | 130 min |
| Phase 2: JS Refactor | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | 165 min |
| Phase 3: Queue & Data Fetching | 3.1, 3.2, 3.3 | 60 min |
| Phase 4: Test Expansion | 4.1, 4.2, 4.3, 4.4, 4.5 | 195 min |
| Phase 5: CI/CD | 5.1, 5.2, 5.3 | 45 min |
| Phase 6: Scheduled Tasks | 6.1, 6.2, 6.3, 6.4 | 60 min |
| **Total** | **26 tasks** | **~11 hours** |
