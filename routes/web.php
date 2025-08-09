<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;

// --- PUBLIC ROUTES ---
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// --- GENERAL AUTHENTICATED ROUTES ---
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->middleware(['can:be-resident'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// --- RESIDENT ROUTES ---
Route::middleware(['auth', 'can:be-resident'])->prefix('residents')->name('residents.')->group(function () {
    Route::get('/', fn() => Inertia::render('Residents/Index'))->name('index');
    Route::get('/home', fn() => Inertia::render('Residents/Home'))->name('home');
    Route::get('/about', fn() => Inertia::render('Residents/About'))->name('about');
    Route::get('/contact-us', fn() => Inertia::render('Residents/ContactUs'))->name('contact');
    Route::get('/faq', fn() => Inertia::render('Residents/Faq'))->name('faq');

    Route::prefix('papers')->name('papers.')->group(function() {
        Route::get('/akap', fn() => Inertia::render('Residents/papers/Akap'))->name('akap');
        Route::get('/brgy-clearance', fn() => Inertia::render('Residents/papers/BrgyClearance'))->name('brgyClearance');
        Route::get('/pwd', fn() => Inertia::render('Residents/papers/Pwd'))->name('pwd');
        Route::get('/gp-indigency', fn() => Inertia::render('Residents/papers/GpIndigency'))->name('gpIndigency');
        Route::get('/residency', fn() => Inertia::render('Residents/papers/Residency'))->name('residency');
        Route::get('/indigency', fn() => Inertia::render('Residents/papers/Indigency'))->name('indigency');
    });
});

// --- ADMIN ROUTES ---
// Admins and Super Admins (super admin auto-passes via Gate::before)
Route::middleware(['auth', 'can:be-admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// --- SUPER ADMIN ROUTES ---
// Only superadmins (because gate check is strict)
Route::middleware(['auth', 'can:be-super-admin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/users', [SuperAdminUserController::class, 'index'])->name('users.index');
    Route::patch('/users/{user}/update-role', [SuperAdminUserController::class, 'updateRole'])->name('users.updateRole');
});

// Auth scaffolding routes
require __DIR__.'/auth.php';
