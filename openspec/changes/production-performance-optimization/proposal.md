# Production Performance Optimization

## Summary

The BDRS application has several critical performance issues that slow it down in production. Middleware overhead, database-centric caching, unoptimized frontend assets, and missing Laravel optimizations all contribute to poor response times. This change addresses the most impactful optimizations.

## Motivation

A performance audit revealed the following issues sorted by impact:

### Critical Issues
- **All subsystems hit MySQL**: Cache, sessions, and queues all use the `database` driver. With 5 custom middleware classes issuing 10+ cache operations per request, every page load generates excessive database queries.
- **APP_DEBUG=true in production**: Exposes stack traces, disables template caching, and slows error handling.
- **No Vite chunk splitting**: All frontend JS (MUI, recharts, framer-motion, gsap, tesseract.js, sweetalert2) bundles into one massive chunk (~2MB+).
- **No production optimization commands run**: `config:cache`, `route:cache`, `event:cache`, `view:cache`, `optimize` are documented but never automated.
- **Lazy loading accessor in User model**: `getFullNameAttribute()` triggers N+1 queries when iterating user collections without pre-loading.

### High Priority Issues
- **Font Awesome CDN loaded synchronously** on every page (render-blocking external script).
- **Ziggy @routes on every page** sends all route names regardless of need.
- **No deploy/optimization script**: Commands exist in AGENT.md but are not automated.
- **Octane DisconnectFromDatabases commented out**: Stale connections persist across requests.
- **whereHas with LIKE %search%**: Admin search queries on names use leading wildcards, preventing index usage.

### Medium Issues
- **public/ph_locations.json (1.1 MB)**: Large static file served for location data.
- **SanitizeRequestInput regex on every request**: Iterates all input on every request.
- **Non-UTC timezone**: Asia/Manila adds overhead to date operations.
- **claim_voucher_code not indexed**: Used in voucher lookup queries.

## Impact

Resolving these issues will:
- Reduce page load time by 50-70% (fewer DB queries per request)
- Reduce JS bundle size from ~2MB+ to well-organized chunks (~400KB initial load)
- Eliminate render-blocking external resources
- Enable proper production caching (config, routes, events, views)
- Reduce database load by moving cache/sessions/queues to Redis
