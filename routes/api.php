<?php

use App\Http\Controllers\Api\IdentityVerificationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'throttle:sensitive'])
    ->prefix('verification')
    ->name('verification.')
    ->group(function (): void {
        Route::post('/upload-id', [IdentityVerificationController::class, 'uploadId'])->name('upload-id');
        Route::post('/upload-selfie', [IdentityVerificationController::class, 'uploadSelfie'])->name('upload-selfie');
        Route::post('/process', [IdentityVerificationController::class, 'process'])->name('process');
        Route::get('/status/{verification:uuid}', [IdentityVerificationController::class, 'status'])
            ->middleware('verification.access')
            ->name('status');
        Route::get('/result/{verification:uuid}', [IdentityVerificationController::class, 'result'])
            ->middleware('verification.access')
            ->name('result');
    });
