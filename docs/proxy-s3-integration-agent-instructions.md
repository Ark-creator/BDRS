# Proxy S3 Integration Agent Instructions

Use this document as the implementation brief for an AI coding agent working on S3-backed image proxying in this Laravel/Inertia application.

## Goal

Implement image storage and delivery so that:

- Uploaded image binaries are stored in S3.
- Database columns store S3 object keys such as `announcements/img_x.jpg`, not raw S3 URLs.
- Browser-facing image URLs are same-origin Laravel routes, not direct `amazonaws.com` URLs.
- Public announcement images can load for guests.
- Sensitive resident credential images, receipts, signatures, and other private uploads require authorization before Laravel streams them from S3.
- Delete and update flows remove the old S3 object from the same disk where it was stored.

## Existing Repo Context

Inspect these files before editing:

- `config/filesystems.php`
  - Defines `s3`, `s3-private`, `public_uploads_disk`, and `private_uploads_disk`.
- `app/Services/ImageCompressionService.php`
  - Compresses uploaded images and currently writes to `Storage::disk('s3')`.
- `app/Http/Controllers/Admin/ImageProxyController.php`
  - Streams announcement/profile/admin images from S3.
- `routes/web.php`
  - Defines public `/images/announcements/{path}`, authenticated `/profile-images/{path}`, and admin `/admin/images/{path}` proxy routes.
- `app/Models/Announcement.php`
  - `image_url` accessor should return a proxy route.
- `app/Models/UserProfile.php`
  - ID/selfie URL accessors should return protected proxy routes.
- `app/Http/Controllers/Admin/AnnouncementController.php`
  - Stores, updates, and deletes announcement images.
- `app/Http/Controllers/Auth/RegisteredUserController.php`
  - Stores valid ID and face images during resident registration.
- `app/Http/Controllers/Admin/RequestDocumentsController.php`
  - Streams private receipt files from `s3-private`.
- `app/Http/Controllers/SuperAdmin/ContentSettingsController.php`
  - Currently stores direct public S3 URLs for officials and footer logo; decide whether to proxy these too or keep them as intentionally public assets.

## Non-Negotiable Rules

- Do not expose raw S3 URLs for protected uploads.
- Do not store full S3 URLs in database columns that should be proxied.
- Do not allow proxy routes to stream arbitrary bucket keys just because a user is authenticated.
- Do not trust the `{path}` route parameter until it is normalized and validated.
- Do not use frontend AWS credentials or direct browser-to-S3 upload unless the task explicitly changes the architecture.
- Do not commit real AWS secrets.

## Recommended Storage Design

Prefer a private S3 bucket with Laravel proxying for all app images. If the project keeps public and private prefixes in the same bucket, keep S3 Block Public Access enabled unless there is an explicit reason to expose a prefix publicly.

Use disk aliases from `config/filesystems.php` instead of hard-coded disk names where possible:

- Public/proxied content: `config('filesystems.public_uploads_disk', 's3')`
- Private/protected content: `config('filesystems.private_uploads_disk', 's3-private')`

The `.env.example` should document these variables:

```dotenv
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_URL=
AWS_ENDPOINT=
AWS_VISIBILITY=private
AWS_USE_PATH_STYLE_ENDPOINT=false
```

For AWS IAM, the app needs only the bucket/prefix permissions it actually uses:

- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`

Add `s3:ListBucket` only if the implementation introduces listing behavior. Normal upload, delete, response, and existence checks should not require broad listing.

## Implementation Steps

### 1. Normalize Upload Storage

Update `ImageCompressionService` so callers can choose the disk:

- Keep the existing return value as an object key string.
- Add a disk parameter or resolve the disk from configuration.
- Store public announcement images on the public/proxied disk.
- Store resident credential images on the private disk.
- Keep file extension and encoded bytes consistent. If the service outputs JPEG data, use `.jpg`; if it preserves PNG/WebP data, keep the matching extension and content type.

Expected usage pattern:

```php
$path = $this->compressionService->compress(
    file: $request->file('image'),
    directory: 'announcements',
    quality: 80,
    disk: config('filesystems.public_uploads_disk', 's3'),
);
```

If named arguments do not match the current method signature, adjust the example to the final signature and update all callers.

### 2. Keep Database Values As Object Keys

For announcements:

- `Announcement::image` should contain `announcements/...`.
- `Announcement::image_url` should return `route('images.announcements', ['path' => $this->image])`.

For resident credentials:

- `UserProfile::valid_id_front_path`, `valid_id_back_path`, and `face_image_path` should contain `id_images/...` or `face_images/...`.
- `valid_id_front_url`, `valid_id_back_url`, and `face_image_url` should return `route('images.profile', ['path' => $path])`.

If legacy rows contain full S3 URLs, add a small helper to convert them back to object keys before deleting or generating proxy URLs. Do not break existing records during the migration.

### 3. Harden Proxy Routes

Keep route patterns that support nested object keys:

```php
Route::get('/images/announcements/{path}', [ImageProxyController::class, 'showPublic'])
    ->where('path', '.*')
    ->name('images.announcements');
```

The proxy controller must normalize and validate every incoming path:

- `ltrim($path, '/')`
- Reject empty paths.
- Reject paths containing `..`, backslashes, null bytes, URL schemes such as `http://`, or query strings.
- Reject paths outside the allowed prefix for the route.

Use route-specific prefix rules:

- Public announcements route allows only `announcements/`.
- Profile image route allows only `id_images/` and `face_images/`.
- Admin generic image route should either be removed or restricted to a deliberate allowlist of prefixes. Avoid a catch-all admin bucket reader.

Use the correct disk for each prefix:

- `announcements/` -> public/proxied disk.
- `id_images/` and `face_images/` -> private disk.
- `payment_receipts/`, signatures, or request attachments -> private disk with request-level authorization.

### 4. Enforce Authorization

For public announcements:

- No authentication is required.
- The path must start with `announcements/`.

For profile credential images:

- A user may view their own profile images.
- A super admin may view all credential images.
- An admin may view only residents in the same barangay, and only if the app gate allows user management or verification.
- Return `403` for unauthorized access and `404` for missing objects.

For receipts/request files:

- Admin routes must verify the current admin can access the document request.
- Resident routes, if added, must verify ownership.

### 5. Stream S3 Responses Safely

Use Laravel filesystem responses:

```php
return Storage::disk($disk)->response($path, null, [
    'Cache-Control' => $cacheHeader,
    'X-Content-Type-Options' => 'nosniff',
]);
```

Recommended cache headers:

- Public announcement images: `public, max-age=86400`
- Protected credential images and receipts: `private, max-age=300`
- Very sensitive one-time documents: `no-store`

Do not generate temporary S3 URLs unless the browser is intentionally allowed to fetch from S3 directly.

### 6. Update Upload/Delete Call Sites

For `AnnouncementController`:

- Store new images under `announcements/`.
- Delete old announcement images from the same disk used to store them.
- On update, delete the old file only after the new file has been successfully stored, or handle rollback explicitly.
- Broadcast payloads should keep using `image_url` from the model accessor.

For `RegisteredUserController`:

- Store valid ID images under `id_images/`.
- Store selfies under `face_images/`.
- Use the private disk.

For `RequestDocumentsController` and resident document flows:

- Store receipts, signatures, and private document images on `s3-private`.
- Keep response methods behind route authorization.

For `ContentSettingsController`:

- If footer logo and official photos should be proxied, store object keys and add public proxy accessors/routes for `site_logos/` and `officials/`.
- If they should remain direct public assets, document that exception and keep deletion helpers able to convert URLs back to S3 keys.

### 7. Keep Frontend Simple

React components should use the URL provided by Laravel:

```jsx
<img src={announcement.image_url} alt={announcement.title} />
```

Do not build S3 URLs in JavaScript. Do not put bucket names, regions, access keys, or endpoint details in frontend code.

## Test Plan

Add or update feature tests around the proxy behavior:

- Public announcement image route returns `200` for an existing `announcements/...` object.
- Public announcement route returns `403` for `id_images/...` or any non-announcement prefix.
- Missing S3 object returns `404`.
- Profile image route requires authentication.
- Profile owner can view their own credential image.
- Admin from the same barangay can view a resident credential image when authorized.
- Admin from another barangay cannot view it.
- Announcement `image_url` does not contain an S3 host.
- User profile credential URLs do not contain an S3 host.
- Updating/deleting an announcement removes the old object from the configured disk.

Useful commands:

```bash
php artisan route:list --path=images
php artisan test --filter=ImageProxy
php artisan test
npm run build
```

If tests use `Storage::fake('s3')` and `Storage::fake('s3-private')`, make sure the fake disk names match the disk names used by the implementation.

## Manual Verification

After implementation:

- Register a resident with ID/selfie uploads.
- Confirm S3 has objects under `id_images/` and `face_images/`.
- Confirm the browser image URLs are `/profile-images/...`, not S3 URLs.
- Confirm an unauthenticated request to `/profile-images/...` redirects or fails.
- Create an announcement with an image.
- Confirm the browser image URL is `/images/announcements/...`.
- Confirm the announcement image loads while logged out.
- Update and delete an announcement, then confirm the old S3 object is gone.
- Check logs for S3 errors after upload, stream, update, and delete flows.

## Acceptance Criteria

The work is complete when:

- All new uploads land in the intended S3 disk/prefix.
- Database records keep object keys instead of raw S3 URLs for proxied assets.
- Model accessors produce Laravel proxy URLs.
- Protected image routes enforce ownership/admin authorization.
- Public image routes are prefix-limited.
- The generic admin image route cannot read arbitrary bucket keys.
- Existing UI pages still display images using their current `image_url` or profile URL props.
- Automated tests and `npm run build` pass, or any failure is documented with the exact reason.
