<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function send(string $to, string $message): bool
    {
        // Make the POST request to the Semaphore API
        $response = Http::post('https://api.semaphore.co/api/v4/messages', [
            'apikey'     => env('SEMAPHORE_API_KEY'),
            'number'     => $to,
            'message'    => $message,
            'sendername' => '' // Use the sender name from .env
        ]);

        if ($response->successful()) {
            return true;
        }

        // If it fails, log the error for debugging
        Log::error('Semaphore SMS sending failed', [
            'status'   => $response->status(),
            'response' => $response->body()
        ]);

        return false;
    }
}