# Add Routes for Orphaned Page Components

## Summary

Six React page component `.jsx` files exist in the codebase but have no route registered for them, making them unreachable to users. This change registers routes for each orphaned page so they become accessible.

## Motivation

During a full page audit, the following orphaned components were discovered:

| Component | Path | Type |
|-----------|------|------|
| `Residents/History` | `resources/js/Pages/Residents/History.jsx` | Resident page (shows request history) |
| `Residents/papers/JobSeeker` | `.../papers/JobSeeker.jsx` | Resident paper request form |
| `Residents/papers/OathOfUndertaking` | `.../papers/OathOfUndertaking.jsx` | Resident paper request form |
| `Residents/papers/BrgyBusinessPermit` | `.../papers/BrgyBusinessPermit.jsx` | Resident paper request form |
| `Residents/papers/PagpapatunayEduk` | `.../papers/PagpapatunayEduk.jsx` | Resident paper request form |
| `SuperAdmin/DocumentsType` | `.../SuperAdmin/DocumentsType.jsx` | Super admin management page |

The corresponding `DocumentType` records already exist in the database seeders for all paper request forms, and the `DocumentRequestController::create` method already maps them:

- `"Job Seeker"` → `JobSeeker`
- `"Oath of Undertaking"` → `OathOfUndertaking`
- `"Brgy Business Permit"` → `BrgyBusinessPermit`
- `"Pagpapatunay Eduk"` → `PagpapatunayEduk`

These pages were likely developed but never wired up to routes.

## Impact

- **Residents**: gain access to 5 new pages (request history + 4 document request forms)
- **Super admins**: gain a document type management page
- **Codebase health**: eliminates dead code / unreachable components
