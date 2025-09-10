<?php


use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\Admin\HistoryController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Resident\HomeController;
use App\Http\Controllers\Admin\MessagesController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Auth\ValidationController;
use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Resident\ContactUsController;
use App\Http\Controllers\Admin\DocumentsListController;
use App\Http\Controllers\Admin\MessagesCounterController;
use App\Http\Controllers\Admin\RequestDocumentsController; 


use App\Http\Controllers\Admin\DocumentGenerationController;
use App\Http\Controllers\Resident\DocumentRequestController;
use App\Http\Controllers\Resident\RequestPaper\BrgyController; 

// --- Admin & SuperAdmin Controllers ---
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\SuperAdmin\UserController as SuperAdminUserController;
use App\Http\Controllers\SuperAdmin\ContentSettingsController;

    Route::get('/', [WelcomeController::class, 'show']);
// --- PUBLIC ROUTES ---
// Route::get('/', function () {
//     return Inertia::render('Welcome', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });

// routes/web.php

// ... other routes

Route::post('/validate-phone', [ValidationController::class, 'checkPhone'])->name('validation.phone');
    Route::post('/validate-email', [ValidationController::class, 'checkEmail'])->name('validation.email');


// ... other routes like Route::post('/register', ...)
// --- GENERAL AUTHENTICATED ROUTES ---
Route::middleware(['auth', 'verified'])->group(function () {
    // Route::get('resident/home', function () {
    //     return Inertia::render('Dashboard');
    // })->middleware(['can:be-resident'])->name('dashboard');
    Route::get('/dashboard', function () {
        return redirect()->route('residents.home');
    })->name('Home');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// --- RESIDENT ROUTES ---
Route::middleware(['auth','verified', 'can:be-resident'])->prefix('residents')->name('residents.')->group(function () {
    Route::get('/', fn() => Inertia::render('Residents/Index'))->name('index');
    Route::get('/home', HomeController::class)->name('home');
    Route::get('/about', fn() => Inertia::render('Residents/About'))->name('about');
    // Route::get('/contact-us', fn() => Inertia::render('Residents/ContactUs'))->name('contact');
    Route::get('/faq', fn() => Inertia::render('Residents/Faq'))->name('faq');
    
    // this route is for Contact Us
    Route::get('/contact-us', fn() => Inertia::render('Residents/ContactUs'))->name('contact');
    Route::post('/contact-us', [ContactUsController::class, 'store'])->name('contact.store');
    Route::post('/request/solo-parent', [DocumentRequestController::class, 'storeSoloParent'])->name('request.solo-parent.store');

    // Messages routes
    Route::get('/conversations', [\App\Http\Controllers\Resident\ConversationController::class, 'index'])->name('conversations.index');
    Route::post('/conversations', [\App\Http\Controllers\Resident\ConversationController::class, 'store'])->name('conversations.store');

    Route::get('/messages/unread-count', [\App\Http\Controllers\Resident\MessageCounterController::class, 'getUnreadCount'])->name('messages.unread-count');
    Route::get('/messages/unread-list', [\App\Http\Controllers\Resident\MessageCounterController::class, 'getUnreadMessagesList'])->name('messages.unread-list');

    Route::get('/request/create/{documentType}', [DocumentRequestController::class, 'create'])->name('request.create');
    // ADD this new generic route for storing the request
    Route::post('/request', [DocumentRequestController::class, 'store'])->name('request.store');
    Route::get('/my-requests', [DocumentRequestController::class, 'index'])
    ->name('requests.index');

    Route::post('/my-requests/{documentRequest}/pay', [DocumentRequestController::class, 'submitPayment'])
    ->name('requests.submit-payment');

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

Route::middleware(['auth', 'verified', 'can:be-admin'])->prefix('admin')->name('admin.')->group(function () {
    // routes/web.php (within your admin middleware group)
    Route::post('/history/{archive}/restore', [HistoryController::class, 'restore'])->name('history.restore');

Route::post('/requests/claim-by-voucher', [RequestDocumentsController::class, 'claimByVoucher'])
     ->name('requests.claim-by-voucher');
    // --- Static Pages ---
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // The conflicting '/announcement' route has been removed.
    Route::get('/history', fn() => Inertia::render('Admin/History'))->name('history');
    Route::get('/payment', fn() => Inertia::render('Admin/Payment'))->name('payment');
    
     Route::post('/requests/{documentRequest}/set-payment', [RequestDocumentsController::class, 'setPaymentAmount'])
         ->name('requests.set-payment');
     Route::get('/settings', function () {
        return Inertia::render('Admin/Settings');
    })->name('settings');
    // --- Document Types Routes ---
    Route::get('/documents', [DocumentsListController::class, 'index'])->name('documents');
    Route::patch('/documents/{documentType}', [DocumentsListController::class, 'update'])->name('documents.update');
    Route::patch('/documents/{documentType}/archive', [DocumentsListController::class, 'archive'])->name('documents.archive');
    Route::get('/documents/archived-data', [DocumentsListController::class, 'getArchivedDocuments'])->name('documents.archived.data');
    Route::patch('/requests/{documentRequest}/status', [RequestDocumentsController::class, 'update'])->name('requests.status.update');
    
    // --- Request Documents Routes ---
    Route::get('/request', [RequestDocumentsController::class, 'index'])->name('request'); 
    Route::get('/requests/{documentRequest}/generate', [DocumentGenerationController::class, 'generate'])->name('requests.generate');
    Route::get('/requests/{documentRequest}/preview', [DocumentGenerationController::class, 'preview'])->name('requests.preview');
    
    // --- Messages Routes ---
    Route::get('/messages', [MessagesController::class, 'index'])->name('messages');
    Route::patch('/messages/{message}/status', [MessagesController::class, 'updateStatus'])->name('messages.updateStatus');
    Route::post('/messages/{message}/reply', [MessagesController::class, 'storeReply'])->name('messages.storeReply');
    // Route::get('/messages/unread', [MessagesCounterController::class, 'getUnreadMessages'])->name('messages.unread');
    Route::get('/messages/unread', [MessagesController::class, 'getUnreadMessages'])->name('messages.unread');
    Route::post('/messages/{contactMessage}/mark-as-read', [MessagesController::class, 'markAsRead'])->name('messages.mark-as-read');

    // --- Resourceful Routes ---
    Route::get('/announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::post('/announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::post('/announcements/{announcement}/update', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('/announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');
    Route::resource('/announcements', AnnouncementController::class);
    Route::get('/history', [HistoryController::class, 'index'])->name('history');

    Route::get('/requests/{documentRequest}/receipt', [RequestDocumentsController::class, 'showReceipt'])
         ->name('requests.receipt');
         Route::get('/payment', PaymentController::class)->name('payment');

});


// --- SUPER ADMIN ROUTES ---
// Only superadmins (because gate check is strict)
Route::middleware(['auth', 'verified', 'can:be-super-admin'])
    ->prefix('superadmin')
    ->name('superadmin.')
    ->group(function () {
    
    // This route shows the list of users on the management page.
    Route::get('/users', [SuperAdminUserController::class, 'index'])->name('users.index');
    
    // This route handles changing ONLY the user's role via the dropdown.
    Route::patch('/users/{user}/update-role', [SuperAdminUserController::class, 'updateRole'])->name('users.updateRole');
    
    // ADD THIS NEW LINE: This route handles updating the user's details (name, email, etc.) from the edit modal.
    Route::patch('/users/{user}', [SuperAdminUserController::class, 'update'])->name('users.update');

    Route::patch('/users/{user}/verify', [SuperAdminUserController::class, 'updateVerificationStatus'])->name('users.verify');
    
     Route::get('/settings', [ContentSettingsController::class, 'show'])->name('settings');
    Route::patch('/settings', [ContentSettingsController::class, 'update'])->name('settings.update');
});

// Auth scaffolding routes
require __DIR__.'/auth.php';
