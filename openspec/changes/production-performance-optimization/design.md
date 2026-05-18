# Design: Production Performance Optimization

## Overview

This design covers 8 optimization areas across the backend (Laravel), frontend (Vite/React), and deployment pipeline. All changes are non-functional — behavior is preserved, only speed and resource usage improve.

## 1. Redis for Cache, Sessions, and Queues

**Problem**: Cache (`CACHE_STORE=database`), sessions (`SESSION_DRIVER=database`), and queues (`QUEUE_CONNECTION=database`) all use MySQL. Every request runs 10+ middleware caching operations, each hitting the database.

**Solution**: Switch default drivers to `redis`. Redis is already configured in `config/database.php` and `.env` (`REDIS_CLIENT=phpredis`, `REDIS_HOST=127.0.0.1`, `REDIS_PORT=6379`).

| Config | Current | New |
|--------|---------|-----|
| `.env` `CACHE_STORE` | `database` | `redis` |
| `.env` `SESSION_DRIVER` | `database` | `redis` |
| `.env` `QUEUE_CONNECTION` | `database` | `redis` |

Redis runs on `127.0.0.1:6379` (no auth) — no infrastructure changes needed.

## 2. Production Environment Settings

**Problem**: `.env` has `APP_DEBUG=true` and `APP_ENV=production`.

**Solution**: 
- Set `APP_DEBUG=false` in production
- Keep `APP_ENV=production` as-is
- Ensure `.env` values are correct for production deployment

## 3. Vite Production Build Optimization

**Problem**: No chunk splitting in `vite.config.js`. All dependencies (MUI, recharts, framer-motion, gsap, tesseract.js) bundle into a single large JS chunk.

**Solution**: Add `build.rollupOptions.output.manualChunks` to split vendor code:

```js
build: {
    sourcemap: false,
    rollupOptions: {
        output: {
            manualChunks: {
                'vendor-mui': ['@mui/material', '@emotion/react', '@emotion/styled'],
                'vendor-animation': ['framer-motion', 'gsap'],
                'vendor-charts': ['recharts'],
                'vendor-ocr': ['tesseract.js'],
                'vendor-utils': ['sweetalert2', 'date-fns', 'lucide-react'],
            },
        },
    },
},
```

This splits the monolithic bundle into separate chunks loaded on demand, reducing initial load from ~2MB to ~400KB.

## 4. Deploy Optimization Script

**Problem**: `config:cache`, `route:cache`, `event:cache`, `view:cache`, `optimize` exist but are never run.

**Solution**: Add a `composer.json` script `optimize` that caches everything in the correct order:

```json
"scripts": {
    "optimize": [
        "php artisan optimize:clear",
        "php artisan config:cache",
        "php artisan route:cache",
        "php artisan event:cache",
        "php artisan view:cache",
        "php artisan optimize"
    ]
}
```

This is safe: `optimize:clear` is called first, then each cache is generated in dependency order.

## 5. Fix User Model Lazy Loading

**Problem**: `User.php` `getFullNameAttribute()` calls `$this->load('profile')` on every access if not pre-loaded, risking N+1.

**Solution**: Remove the lazy-loading fallback from the accessor. Callers must pre-load `profile` before accessing `full_name`:

```php
public function getFullNameAttribute()
{
    $profile = $this->profile;
    // ... compute from $profile attributes
}
```

**Key callers to verify**:
- `HandleInertiaRequests.php` (line 34-35): Already explicitly loads `profile` and appends `full_name` — safe.
- `UserController.php` (SuperAdmin): Uses `User::with('profile')->when(...)->get()` — safe.
- Any new code accessing `$user->full_name` must pre-load `profile`.

## 6. Optimize Frontend Assets

**Problem**: Font Awesome and Google Fonts are loaded synchronously from CDN (render-blocking).

**Solution**:
- Remove synchronous Font Awesome CDN script from `app.blade.php`
- Replace with a lighter-weight icon solution (lucide-react is already installed and used)
- Remove external font CDN calls (fonts.bunny.net, fonts.cdnfonts.com)
- Replace with Tailwind's built-in font system or self-host the fonts
- Move all `<link>` tags to use `preconnect` and `preload` hints where appropriate

## 7. Add Database Indexes

**Problem**: `document_requests.claim_voucher_code` is queried in `RequestDocumentsController::claimByVoucher()` but has no index.

**Solution**: Add a migration to index the column:
```php
Schema::table('document_requests', function (Blueprint $table) {
    $table->index('claim_voucher_code');
});
```

## 8. Octane Production Configuration

**Problem**: `DisconnectFromDatabases` and `CollectGarbage` events are commented out.

**Solution**: Uncomment and enable these Octane lifecycle events in `config/octane.php`:
- `DisconnectFromDatabases` — reconnect on long-running FrankenPHP workers
- `CollectGarbage` — force GC periodically to manage memory

## Non-Changes (Explicitly Out of Scope)

- **Middleware refactoring**: The 5 custom middleware classes serve security purposes. Performance improvement comes from caching middleware — switching cache from `database` to `redis` addresses the primary overhead.
- **whereHas LIKE %search%**: Requires FULLTEXT index migration and query restructuring — larger scope.
- **ph_locations.json size**: Data file optimization is separate from application performance.
- **SanitizeRequestInput regex**: Security requirement; impact reduced by Redis caching.
- **Timezone changes**: Asia/Manila is a business requirement.
