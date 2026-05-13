<?php

namespace App\Http\Controllers\Admin;

use App\Events\AnnouncementUpdated;
use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    public function __construct(
        private ImageCompressionService $compressionService
    ) {}

    public function index()
    {
        $announcements = Announcement::select(['id', 'tag', 'title', 'description', 'link', 'image', 'user_id', 'created_at'])
            ->with('user.profile:user_id,first_name,middle_name,last_name')
            ->latest()
            ->paginate(5)
            ->through(fn ($announcement) => [
                'id' => $announcement->id,
                'tag' => $announcement->tag,
                'title' => $announcement->title,
                'description' => $announcement->description,
                'link' => $announcement->link,
                'image_url' => $announcement->image_url,
                'created_at' => $announcement->created_at,
                'user' => $announcement->user,
            ]);

        return Inertia::render('Admin/Announcement', [
            'announcements' => $announcements,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tag' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'link' => 'nullable|url',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
        ]);

        $imagePath = $this->compressionService->compress($request->file('image'), 'announcements', 80);

        $announcement = Announcement::create([
            'tag' => $request->tag,
            'title' => $request->title,
            'description' => $request->description,
            'link' => $request->link,
            'image' => $imagePath,
            'barangay_id' => Auth::user()->barangay_id,
            'user_id' => Auth::id(),
        ]);

        broadcast(new AnnouncementUpdated($announcement, 'created'))->toOthers();
        $this->flushAnnouncementCache();

        return Redirect::route('admin.announcements.index')->with('success', 'Announcement created successfully.');
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'tag' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'link' => 'nullable|url',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240',
        ]);

        $updateData = [
            'tag' => $validated['tag'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'link' => $validated['link'],
        ];

        if ($request->hasFile('image')) {
            if ($announcement->image) {
                Storage::disk(config('filesystems.public_uploads_disk', 's3'))->delete($announcement->image);
            }
            $updateData['image'] = $this->compressionService->compress($request->file('image'), 'announcements', 80);
        }

        $announcement->update($updateData);

        broadcast(new AnnouncementUpdated($announcement->fresh(), 'updated'))->toOthers();
        $this->flushAnnouncementCache();

        return Redirect::route('admin.announcements.index')->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement)
    {
        $announcementData = $announcement->replicate();
        $announcementData->setAttribute('id', $announcement->id);

        if ($announcement->image) {
            Storage::disk(config('filesystems.public_uploads_disk', 's3'))->delete($announcement->image);
        }

        $announcement->delete();

        broadcast(new AnnouncementUpdated($announcementData, 'deleted'))->toOthers();
        $this->flushAnnouncementCache();

        return Redirect::route('admin.announcements.index')->with('success', 'Announcement deleted successfully.');
    }

    private function flushAnnouncementCache(): void
    {
        Cache::forget('welcome.announcements');
        Cache::forget('resident.announcements');
    }
}
