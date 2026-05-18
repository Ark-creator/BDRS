# Proposal: Codebase Optimization & Automation

## Summary

Consolidate the triplicated document validation logic (Go WASM / JS fallback / Python AI) into a single source of truth, refactor the monolithic `identityWasmValidator.js` into maintainable modules, expand test coverage for critical paths, fix queue configuration drift, and add CI/CD automation. This reduces manual validation effort, eliminates silent drift between validation tiers, and makes the codebase easier to maintain and deploy.

## Motivation

The BDRS codebase has grown sophisticated features (identity verification, document management, payments, messaging, announcements) but several structural issues have accumulated:

1. **Triplicated validation logic** — Document type profiles (keywords, ID patterns, field extractors) are defined independently in `wasm/validation.go` (830 lines), `resources/js/Services/identityWasmValidator.js` (1689 lines), and `python-ai/app/services/ocr.py` (788 lines). Any change to one must be replicated in all three, and they have already drifted apart. This is the primary source of "wrong implementation alignment" — the three tiers should derive from a single shared config.

2. **Monolithic JS file** — `identityWasmValidator.js` at 1689 lines handles OCR pipeline, document validation, face detection, field extraction, quality analysis, and health checks. It violates single-responsibility and is hard to test or modify without risk of regression.

3. **Inaccurate data fetching** — The `AiIdentityVerificationClient` HTTP client calls the Python AI service with circuit breaker timeout/exponential backoff, but the Horizon queue configuration targets `redis` while the default queue driver is `database`. Jobs may silently queue but never process. Additionally, eager-loading patterns in admin queries need review.

4. **Minimal test coverage** — Only ~12 test files exist for a system with identity verification, document generation, payments, admin workflows, messaging, announcements, middleware, and multi-role access. Critical paths like `DocumentGenerationController`, `PaymentController`, and `IdentityVerificationService` have no tests.

5. **No CI/CD pipeline** — No GitHub Actions or CI configuration. WASM rebuilds, test runs, and deployments are manual processes.

6. **Sparse scheduled automation** — Only one scheduled task (`CleanupTemporaryFilesJob` daily at 02:15). Opportunities exist for stale draft cleanup, verification retention cleanup, and payment reconciliation automation.

## Scope

- Extract document type profiles into a shared JSON/YAML config consumed by Go WASM, JS, and Python
- Refactor `identityWasmValidator.js` into separate modules (ocrService.js, documentValidation.js, faceDetection.js, imageQuality.js, healthChecker.js)
- Fix Horizon queue driver mismatch (database → redis) or update config to match actual setup
- Audit and optimize eager-loading in admin/resident controllers
- Add test suites for: Identity Verification pipeline, Document Generation, Payment workflows, Admin Review workflows, Security Middleware
- Add GitHub Actions CI: test runner, WASM build, static analysis, linting
- Add scheduled tasks: stale draft cleanup, verification retention cleanup, payment reconciliation
- Align Python AI service optionality — make profile config single-source so WASM-only deployments don't require Python for document type data

## Non-goals

- Porting WASM to TinyGo (separate change)
- Removing Python AI service entirely (still needed for server-side fraud analysis)
- Rewriting the frontend UI components
- Changing the authentication or authorization model
- Database migration squashing (cosmetic, no functional impact)
- Performance profiling or optimization beyond query eager-loading fixes
- Migrating from Laravel Reverb to Pusher or other WebSocket providers

