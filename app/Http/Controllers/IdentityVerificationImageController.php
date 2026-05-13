<?php

namespace App\Http\Controllers;

use App\Models\Verification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class IdentityVerificationImageController extends Controller
{
    public function __invoke(Request $request, Verification $verification, string $type)
    {
        abort_unless(in_array($type, ['id', 'selfie'], true), 404);
        abort_unless($request->user()?->can('view', $verification), 403);

        $path = $type === 'id' ? $verification->id_image_path : $verification->selfie_image_path;
        abort_unless($path, 404);

        $disk = Storage::disk((string) config('identity_verification.storage.disk', 's3-private'));
        abort_unless($disk->exists($path), 404);

        return $disk->response($path, null, [
            'Cache-Control' => 'private, max-age=300',
        ]);
    }
}
