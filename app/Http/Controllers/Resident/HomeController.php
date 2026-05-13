<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\DocumentType;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __invoke()
    {
        $documentTypes = Cache::remember('resident.document_types', now()->addMinutes(10), function () {
            return DocumentType::where('is_archived', false)->get();
        });

        $announcements = Cache::remember('resident.announcements', now()->addMinutes(5), function () {
            return Announcement::select(['id', 'tag', 'title', 'description', 'link', 'image', 'user_id', 'created_at'])
                ->with(['user.profile:user_id,first_name,middle_name,last_name'])
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($announcement) => [
                    'id' => $announcement->id,
                    'tag' => $announcement->tag,
                    'title' => $announcement->title,
                    'description' => $announcement->description,
                    'link' => $announcement->link,
                    'image_url' => $announcement->image_url,
                    'created_at' => $announcement->created_at,
                    'user' => $announcement->user,
                ]);
        });

        return Inertia::render('Residents/Home', [
            'documentTypes' => $documentTypes,
            'announcements' => $announcements,
        ]);
    }
}
