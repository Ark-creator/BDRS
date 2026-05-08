<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;

class ImageProxyController extends Controller
{
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
}