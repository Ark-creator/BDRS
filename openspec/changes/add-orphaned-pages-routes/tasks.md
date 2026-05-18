# Implementation Tasks

## Task 1: Create PaperController ✅

**File**: `app/Http/Controllers/Resident/RequestPaper/PaperController.php`

Create a new controller with 4 methods following the same pattern as `BrgyController`:

- `jobSeeker()` — looks up `DocumentType::where('name', 'Job Seeker')`, verifies user, checks availability, renders `Residents/papers/JobSeeker` with `documentType` and `userProfile`
- `oathOfUndertaking()` — same for `'Oath of Undertaking'`, renders `Residents/papers/OathOfUndertaking`
- `brgyBusinessPermit()` — same for `'Brgy Business Permit'`, renders `Residents/papers/BrgyBusinessPermit` (append `full_name` and `full_address` to profile like `DocumentRequestController::create` does)
- `pagpapatunayEduk()` — same for `'Pagpapatunay Eduk'`, renders `Residents/papers/PagpapatunayEduk`

Each method should:
1. Look up `DocumentType` by name
2. Check user is verified (`$user->is_verified`)
3. Check document is not archived and is requestable
4. Return `Inertia::render(...)` with `documentType` and `userProfile`

---

## Task 2: Add Resident Paper Routes ✅

**File**: `routes/web.php` (inside the existing `residents.papers.*` group at line 145)

Add 4 GET routes:
```php
Route::get('/job-seeker', [PaperController::class, 'jobSeeker'])->name('jobSeeker');
Route::get('/oath-of-undertaking', [PaperController::class, 'oathOfUndertaking'])->name('oathOfUndertaking');
Route::get('/brgy-business-permit', [PaperController::class, 'brgyBusinessPermit'])->name('brgyBusinessPermit');
Route::get('/pagpapatunay-eduk', [PaperController::class, 'pagpapatunayEduk'])->name('pagpapatunayEduk');
```

Add import for the new controller at the top of `web.php`.

---

## Task 3: Add Resident History Route ✅

**File**: `routes/web.php` (inside the existing `residents.*` group)

Add a GET route for `/history`:
```php
Route::get('/history', [DocumentRequestController::class, 'history'])->name('history');
```

---

## Task 4: Add History Method to DocumentRequestController ✅

**File**: `app/Http/Controllers/Resident/DocumentRequestController.php`

Add a `history()` method (after `submitPayment`):
```php
public function history()
{
    $userId = Auth::id();

    $requestHistory = ImmutableDocumentsArchiveHistory::query()
        ->where('user_id', $userId)
        ->whereIn('status', ['Claimed', 'Rejected'])
        ->with(['documentType', 'processor.profile'])
        ->latest('original_created_at')
        ->paginate(10);

    return Inertia::render('Residents/History', [
        'requestHistory' => $requestHistory,
    ]);
}
```

---

## Task 5: Add Super Admin Documents Route ✅

**File**: `routes/web.php` (inside the existing `superadmin.*` group)

Add a GET route for `/documents`:
```php
Route::get('/documents', fn() => Inertia::render('SuperAdmin/DocumentsType'))->name('documents');
```

---

## Task 6: Verify All Routes ✅

After implementation, test that every route returns HTTP 200 (for authenticated users) by running curl against the dev server or production URL. Verify each route resolves to the correct Inertia page component.

Required routes to verify:

| Route | Expected Behavior |
|-------|------------------|
| `GET /residents/papers/job-seeker` | Renders `Residents/papers/JobSeeker` |
| `GET /residents/papers/oath-of-undertaking` | Renders `Residents/papers/OathOfUndertaking` |
| `GET /residents/papers/brgy-business-permit` | Renders `Residents/papers/BrgyBusinessPermit` |
| `GET /residents/papers/pagpapatunay-eduk` | Renders `Residents/papers/PagpapatunayEduk` |
| `GET /residents/history` | Renders `Residents/History` |
| `GET /superadmin/documents` | Renders `SuperAdmin/DocumentsType` |
