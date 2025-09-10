<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\WelcomeContent;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function show(): Response
    {
        $announcements = Announcement::latest()->take(5)->get();
        $settings = WelcomeContent::firstOrNew([]);
        
        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'announcements' => $announcements,
            'footerData'    => $settings,
            'officials'     => $settings->officials ?? [],
        ]);
    }
}