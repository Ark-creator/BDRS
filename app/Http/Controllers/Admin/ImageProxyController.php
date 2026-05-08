<?php

namespace App\Http\Controllers\Admin;

use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;

class ImageProxyController extends Controller
{
    public function showProfileImage(Request $request, string $path)
    {
        $path = ltrim($path, '/');

        if (!$this->isCredentialImagePath($path)) {
            abort(403, 'Access denied.');
        }

        $profile = UserProfile::with('user')
            ->where(function ($query) use ($path) {
                $query->where('valid_id_front_path', $path)
                    ->orWhere('valid_id_back_path', $path)
                    ->orWhere('face_image_path', $path);
            })
            ->first();

        if (!$profile) {
            abort(404, 'Image not found.');
        }

        if (!$this->canViewCredentialImage($request, $profile)) {
            abort(403, 'Access denied.');
        }

        $disk = Storage::disk('s3');

        if (!$disk->exists($path)) {
            abort(404, 'Image not found.');
        }

        return $disk->response($path, null, [
            'Cache-Control' => 'private, max-age=300',
        ]);
    }

    public function show(string $path)
    {
        $disk = Storage::disk('s3');

        if (!$disk->exists($path)) {
            abort(404, 'Image not found.');
        }

        return $disk->response($path);
    }

    public function showPublic(string $path)
    {
        if (!str_starts_with($path, 'announcements/')) {
            abort(403, 'Access denied.');
        }

        $disk = Storage::disk('s3');

        if (!$disk->exists($path)) {
            abort(404, 'Image not found.');
        }

        return $disk->response($path);
    }

    private function isCredentialImagePath(string $path): bool
    {
        return str_starts_with($path, 'id_images/')
            || str_starts_with($path, 'face_images/');
    }

    private function canViewCredentialImage(Request $request, UserProfile $profile): bool
    {
        $user = $request->user();

        if (!$user) {
            return false;
        }

        if ((int) $profile->user_id === (int) $user->id) {
            return true;
        }

        if (!$user->can('manage-users')) {
            return false;
        }

        if ($user->role === 'super_admin') {
            return true;
        }

        return (int) $profile->user?->barangay_id === (int) $user->barangay_id;
    }
}
