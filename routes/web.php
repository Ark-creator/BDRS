<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;

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

// --- ADMIN ROUTES ---
// Protected by the 'be-admin' Gate (accessible by Admins and Super Admins)
Route::middleware(['auth', 'can:be-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // Add other admin-specific routes here (e.g., for managing document requests)
});


// In routes/web.php
Route::middleware(['auth', 'can:be-super-admin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    // Change 'superadmin.users.Index' to just 'users.index'
    Route::get('/users', [SuperAdminUserController::class, 'index'])->name('users.index'); // <-- CORRECTED
    Route::patch('/users/{user}/update-role', [SuperAdminUserController::class, 'updateRole'])->name('users.updateRole');
});

require __DIR__.'/auth.php';
