<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Models\Announcement; // <-- Make sure to import the Announcement model

class WelcomeController extends Controller
{
    /**
     * Show the welcome page with announcements.
     *
     * @return \Inertia\Response
     */
    public function show()
    {
        // Fetch the 5 most recent active announcements
        $announcements = Announcement::where('is_active', true)
                                     ->latest()
                                     ->take(5)
                                     ->get();

        // Pass the announcements and other props to the Welcome component
        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'announcements' => $announcements, // <-- This passes the data
        ]);
    }
}