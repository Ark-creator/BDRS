# Design: Adding Routes for Orphaned Page Components

## Overview

Six React page `.jsx` files exist with no corresponding route. This design covers adding routes and any necessary controller logic to make them accessible.

## Page Analysis

| Component | Props Needed | Auth Required | Existing DocType in Seeder |
|-----------|-------------|---------------|---------------------------|
| `Residents/papers/JobSeeker` | `auth`, `userProfile`, `documentType` | Resident | `"Job Seeker"` |
| `Residents/papers/OathOfUndertaking` | `auth`, `userProfile`, `documentType` | Resident | `"Oath of Undertaking"` |
| `Residents/papers/BrgyBusinessPermit` | `auth`, `userProfile`, `documentType` | Resident | `"Brgy Business Permit"` |
| `Residents/papers/PagpapatunayEduk` | `auth`, `userProfile`, `documentType` | Resident | `"Pagpapatunay Eduk"` |
| `Residents/History` | `auth`, `requestHistory` | Resident | N/A |
| `SuperAdmin/DocumentsType` | none (stub) | Super Admin | N/A |

## Route Design

### Group A: Paper Request Forms (4 pages)

**Pattern**: Same as existing `papers/*` routes, using a dedicated controller method per document type.

- **URL**: `/residents/papers/job-seeker`, `/residents/papers/oath-of-undertaking`, etc.
- **Method**: GET
- **Middleware**: `auth`, `verified`, `can:be-resident`, throttle
- **Controller**: A new `App\Http\Controllers\Resident\RequestPaper\PaperController` with one method per document type (or a generic `show` method that accepts a `type` param)
- **Logic**: Look up `DocumentType` by `name`, verify user, check availability, render Inertia component
- **POST**: Already exists via `POST /residents/request` (route `residents.request.store`)

**Route declaration** (under existing `residents.papers.*` group):
```php
Route::get('/job-seeker', [PaperController::class, 'jobSeeker'])->name('jobSeeker');
Route::get('/oath-of-undertaking', [PaperController::class, 'oathOfUndertaking'])->name('oathOfUndertaking');
Route::get('/brgy-business-permit', [PaperController::class, 'brgyBusinessPermit'])->name('brgyBusinessPermit');
Route::get('/pagpapatunay-eduk', [PaperController::class, 'pagpapatunayEduk'])->name('pagpapatunayEduk');
```

**Controller method pattern** (reuse logic from `DocumentRequestController::create`):
```php
public function jobSeeker()
{
    $documentType = DocumentType::where('name', 'Job Seeker')->firstOrFail();
    // verify user, check availability, render
}
```

### Group B: Resident History Page

**URL**: `/residents/history`
**Method**: GET
**Middleware**: `auth`, `verified`, `can:be-resident`, throttle
**Controller**: Add a `history` method to `DocumentRequestController`
**Logic**: Query `ImmutableDocumentsArchiveHistory` for the current user's Claimed/Rejected requests (same pattern as `index` method's past requests query)

```php
public function history()
{
    $requestHistory = ImmutableDocumentsArchiveHistory::query()
        ->where('user_id', Auth::id())
        ->whereIn('status', ['Claimed', 'Rejected'])
        ->with(['documentType', 'processor.profile'])
        ->latest('original_created_at')
        ->paginate(10);

    return Inertia::render('Residents/History', [
        'requestHistory' => $requestHistory,
    ]);
}
```

### Group C: Super Admin Document Types

**URL**: `/superadmin/documents`
**Method**: GET
**Middleware**: `auth`, `verified`, `can:manage-users`, throttle
**Controller**: Add method to `SuperAdminUserController` or create a new `DocumentTypeController`
**Note**: The JSX component is currently a stub. A route will be registered so the page is reachable. Building out the full component is out of scope for this change -- a follow-up can add the CRUD UI.

## No New Files Needed (Except Controller)

- **New controller**: `app/Http/Controllers/Resident/RequestPaper/PaperController.php`
- **Edited files**: `routes/web.php`, `app/Http/Controllers/Resident/DocumentRequestController.php`

## URL Naming Convention

Use kebab-case for URLs matching the existing style:
- `/job-seeker` (route name: `residents.papers.jobSeeker`)
- `/oath-of-undertaking` (route name: `residents.papers.oathOfUndertaking`)
- `/brgy-business-permit` (route name: `residents.papers.brgyBusinessPermit`)
- `/pagpapatunay-eduk` (route name: `residents.papers.pagpapatunayEduk`)
- `/history` (route name: `residents.history`)
- `/superadmin/documents` (route name: `superadmin.documents`)
