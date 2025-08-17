<?php
// app/Http/Controllers/Resident/HomeController.php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use App\Models\Announcement; // <-- 1. Import the Announcement model
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __invoke()
    {
        // Fetch only the document types that are NOT archived
        $documentTypes = DocumentType::where('is_archived', false)->get();

        // 2. Fetch the 5 latest announcements
        $announcements = Announcement::latest()->take(5)->get();

        // 3. Pass BOTH props to your Inertia component
        return Inertia::render('Residents/Home', [
            'documentTypes' => $documentTypes,
            'announcements' => $announcements, // <-- Add this line
        ]);
    }
}