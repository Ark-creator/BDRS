<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Resident\HomeController;
use App\Http\Controllers\Admin\MessagesController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Auth\ValidationController;
use App\Http\Controllers\Resident\ContactUsController;
use App\Http\Controllers\Admin\DocumentsListController;
use App\Http\Controllers\Admin\RequestDocumentsController; 
use App\Http\Controllers\Admin\DocumentGenerationController;
use App\Http\Controllers\Resident\DocumentRequestController;
use App\Http\Controllers\Resident\RequestPaper\BrgyController; 
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

// routes/web.php

// ... other routes

Route::post('/validate-phone', [ValidationController::class, 'checkPhone'])->name('validation.phone');
    Route::post('/validate-email', [ValidationController::class, 'checkEmail'])->name('validation.email');


// ... other routes like Route::post('/register', ...)
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
    Route::get('/home', HomeController::class)->name('home');
    Route::get('/about', fn() => Inertia::render('Residents/About'))->name('about');
    Route::get('/contact-us', fn() => Inertia::render('Residents/ContactUs'))->name('contact');
    Route::get('/faq', fn() => Inertia::render('Residents/Faq'))->name('faq');
    
    // this route is for Contact Us
    Route::get('/contact-us', fn() => Inertia::render('Residents/ContactUs'))->name('contact');
    Route::post('/contact-us', [ContactUsController::class, 'store'])->name('contact.store');
        Route::post('/request/solo-parent', [DocumentRequestController::class, 'storeSoloParent'])->name('request.solo-parent.store');

 Route::get('/request/create/{documentType}', [DocumentRequestController::class, 'create'])->name('request.create');
    
    // ADD this new generic route for storing the request
    Route::post('/request', [DocumentRequestController::class, 'store'])->name('request.store');


    Route::prefix('papers')->name('papers.')->group(function() {
        Route::get('/akap', fn() => Inertia::render('Residents/papers/Akap'))->name('akap');
        Route::get('/solo-parent', fn() => Inertia::render('Residents/papers/SoloParent'))->name('soloParent');

        // GET route to show the form
        Route::get('/brgy-clearance', [BrgyController::class, 'brgyClearance'])->name('brgyClearance');
        
        
        // POST route to handle the form submission
        Route::post('/brgy-clearance', [BrgyController::class, 'storeBrgyClearance'])->name('brgyClearance.store');
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
    Route::get('/announcement', fn() => Inertia::render('Admin/Announcement'))->name('announcement');
    Route::get('/documents', fn() => Inertia::render('Admin/Documents'))->name('documents');
    Route::get('/history', fn() => Inertia::render('Admin/History'))->name('history');
    Route::get('/messages', fn() => Inertia::render('Admin/Messages'))->name('messages');
    Route::get('/payment', fn() => Inertia::render('Admin/Payment'))->name('payment');
    
    // this is for documents pages fetch the data rendering
    // Route::get('/documents', [DocumentsListController::class, 'index'])->name('documents');
    // update and delete function here
    Route::patch('/documents/{documentType}', [DocumentsListController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{documentType}', [DocumentsListController::class, 'destroy'])->name('documents.destroy');

    // this is for request documents pages fetch the data rendering
    Route::get('/request', [RequestDocumentsController::class, 'index'])->name('request'); 
        Route::get('/requests/{documentRequest}/generate', [DocumentGenerationController::class, 'generate'])->name('requests.generate');
// Updated to use controller

    // messages render
    Route::get('/messages', [MessagesController::class, 'index'])->name('messages');
    Route::patch('/messages/{message}/status', [MessagesController::class, 'updateStatus'])->name('messages.updateStatus');
    Route::post('/messages/{message}/reply', [MessagesController::class, 'storeReply'])->name('messages.storeReply');


});


// --- SUPER ADMIN ROUTES ---
// Only superadmins (because gate check is strict)
Route::middleware(['auth', 'can:be-super-admin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/users', [SuperAdminUserController::class, 'index'])->name('users.index');
    Route::patch('/users/{user}/update-role', [SuperAdminUserController::class, 'updateRole'])->name('users.updateRole');
});

// Auth scaffolding routes
require __DIR__.'/auth.php';
