<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Group for all Resident-related pages
Route::middleware(['auth', 'verified'])->prefix('residents')->name('residents.')->group(function () {
    
    // Route for /residents, points to Residents/Index.jsx
    Route::get('/', function () {
        return Inertia::render('Residents/Index');
    })->name('index');
    
    // Route for /residents/home, points to Residents/Home.jsx
    Route::get('/home', function () {
        return Inertia::render('Residents/Home');
    })->name('home');

    // Route for /residents/about, points to Residents/About.jsx
    Route::get('/about', function () {
        return Inertia::render('Residents/About');
    })->name('about');

    // Route for /residents/contact-us, points to Residents/ContactUs.jsx
    Route::get('/contact-us', function () {
        return Inertia::render('Residents/ContactUs');
    })->name('contact');

    // Route for /residents/faq, points to Residents/Faq.jsx
    Route::get('/faq', function () {
        return Inertia::render('Residents/Faq');
    })->name('faq');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
