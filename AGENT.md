# OpenSpec Workspace Rules

This repository uses OpenSpec + OpenCode workflow.

The AI agent must understand and follow the OpenSpec architecture.

---

# Build & Run Commands

- `composer dev` - Start all services (Octane, queue, logs, Vite)
- `php artisan octane:start` - Start Octane server directly
- `php artisan octane:start --watch` - Start Octane with file watching (dev)
- `npm run build` - Build frontend assets
- `npm run dev` - Start Vite dev server
- `composer test` - Run tests

# Production Optimization Commands

After deployment, always run:
```
php artisan config:cache
php artisan route:cache
php artisan event:cache
php artisan view:cache
php artisan optimize
```

To clear caches:
```
php artisan optimize:clear
```

# Linting

- `./vendor/bin/pint` - Run Laravel Pint (PHP code style fixer)
- `./vendor/bin/pint --test` - Check code style without fixing

---

# Architecture: Laravel Octane + FrankenPHP

This project uses Laravel Octane with FrankenPHP for high-performance request handling.

Key considerations:
- Do NOT use static service container bindings that persist across requests
- Always flush state in Octane listeners if adding new ones
- Use `Cache::remember()` for frequently queried, rarely changing data
- Cache tags used: `welcome.*`, `resident.*`, `admin.dashboard.*`, `admin.document_types.*`

---

# Database Indexes

Performance indexes have been added via migration `2026_05_13_213021_add_performance_indexes_to_all_tables.php`.

Key indexed columns:
- All foreign key columns (`*_id`) on every table
- All `status` columns used in WHERE clauses
- All `created_at` columns used in ORDER BY
- Composite indexes for common query patterns (e.g., `document_requests.status + user_id`)

---

# Folder Responsibilities

## .opencode/commands

Contains custom AI command behaviors.

Files:
- opsx-propose.md = proposal generation workflow
- opsx-apply.md = implementation workflow
- opsx-explore.md = repository analysis workflow
- opsx-archive.md = archival workflow

The AI must follow these command instructions when executing tasks.

---

## .opencode/skills

Contains reusable AI engineering skills.

The AI should:
- reuse skills before generating new logic
- follow skill-specific standards
- compose multiple skills when needed

---

## openspec/specs

Contains formal specifications.

Each spec defines:
- requirements
- implementation details
- constraints
- architecture decisions
- acceptance criteria

The AI must:
- read specs before coding
- validate implementation against specs
- avoid deviating from specifications

---

## openspec/changes

Contains active feature changes and implementation plans.

The AI should:
- track active modifications
- preserve compatibility
- understand pending migrations/refactors

---

## openspec/archive

Contains completed or deprecated specs/changes.

Use as historical reference only.

Do not restore archived behavior unless requested.

---

## openspec/config.yaml

Main OpenSpec configuration file.

The AI must respect:
- project schema
- configured workflows
- enabled tools
- repository conventions
