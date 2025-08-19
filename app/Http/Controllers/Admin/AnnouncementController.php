<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage; // Added for file deletion
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Changed to eager load user without profile for simplicity,
        // as the frontend only uses user.name
        $announcements = Announcement::latest()
            ->with('user')
            ->get();

        return Inertia::render('Admin/Announcement', [
            'announcements' => $announcements
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tag' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'link' => 'nullable|url',
            // Changed max size to 10MB (10240 KB)
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:10240',
        ]);

        $imagePath = $request->file('image')->store('announcements', 'public');

        Announcement::create([
            'tag' => $request->tag,
            'title' => $request->title,
            'description' => $request->description,
            'link' => $request->link,
            'image' => $imagePath,
            'user_id' => Auth::id(), // Get the currently logged-in user's ID
        ]);

        return Redirect::route('admin.announcements.index')->with('success', 'Announcement created successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Announcement $announcement)
    {
        // Delete the image file from storage if it exists
        if ($announcement->image) {
            Storage::disk('public')->delete($announcement->image);
        }

        $announcement->delete();
        return Redirect::route('admin.announcements.index')->with('success', 'Announcement deleted successfully.');
    }
}