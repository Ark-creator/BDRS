# Implementation Tasks

## Task 1: Switch Cache, Session, and Queue to Redis ✅

**Files**: `.env`

Change these values in `.env`:
- `CACHE_STORE=database` → `CACHE_STORE=redis`
- `SESSION_DRIVER=database` → `SESSION_DRIVER=redis`
- `QUEUE_CONNECTION=database` → `QUEUE_CONNECTION=redis`

Also set `APP_DEBUG=false` for production.

---

## Task 2: Add Vite Production Build Optimization ✅

**File**: `vite.config.js`

Add `build` section with `manualChunks` to split vendor dependencies:
- `vendor-mui`: `@mui/material`, `@emotion/react`, `@emotion/styled`
- `vendor-animation`: `framer-motion`, `gsap`
- `vendor-charts`: `recharts`
- `vendor-ocr`: `tesseract.js`
- `vendor-utils`: `sweetalert2`, `date-fns`, `lucide-react`

Set `sourcemap: false` for production builds.

---

## Task 3: Add Deploy Optimization Script ✅

**File**: `composer.json`

Add an `optimize` script that runs all Laravel cache commands in sequence:
```
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan view:cache
php artisan optimize
```

---

## Task 4: Fix User Model Lazy Loading ✅

**File**: `app/Models/User.php`

Remove `$this->load('profile')` from the `getFullNameAttribute()` accessor. Replace with a safe fallback that returns data from `$this->profile` only if the relation is loaded. Callers must pre-load `profile` before accessing `full_name`.

---

## Task 5: Optimize Frontend Asset Loading ✅

**File**: `resources/views/app.blade.php`

- Remove synchronous Font Awesome CDN script tag
- Remove external font CSS imports (fonts.bunny.net, fonts.cdnfonts.com)
- The app uses lucide-react (already installed) for icons — no icon library needed from CDN
- Fonts should either be self-hosted or use Tailwind's font-family defaults

---

## Task 6: Add Database Index for claim_voucher_code ✅

**File**: New migration (`database/migrations/YYYY_MM_DD_HHMMSS_add_voucher_index_to_document_requests.php`)

Add an index on `document_requests.claim_voucher_code` to speed up voucher lookup queries.

---

## Task 7: Enable Octane Production Events ✅

**File**: `config/octane.php`

Uncomment `DisconnectFromDatabases::class` and `CollectGarbage::class` in the Octane event listeners configuration.

---

## Task 8: Verify All Optimizations ✅

After implementation:
1. Run `php -l` on all modified PHP files to verify syntax
2. Verify `.env` has correct production values
3. Verify `npm run build` completes successfully with chunk splitting
4. Verify `composer run-script optimize` runs all cache commands
5. Test application loads and key pages render correctly (curl against production/dev URL)
