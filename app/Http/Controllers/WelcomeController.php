<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Display the welcome page with the latest announcements.
     *
     * @return \Inertia\Response
     */
    public function show(): Response
    {
        // Fetch the 5 most recent announcements from the database
        $announcements = Announcement::latest()->take(5)->get();

        // Render the 'Welcome' Inertia component and pass the necessary props
        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'laravelVersion' => Application::VERSION,
            'phpVersion' => PHP_VERSION,
            'announcements' => $announcements, // <-- Pass the announcements here
        ]);
    }
}