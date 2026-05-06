<?php

namespace App\Services;

use App\Models\UserProfile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function send(string $to, string $message): bool
    {
        $apiKey = config('services.semaphore.key');
        if (!$apiKey) {
            Log::warning('Semaphore SMS sending skipped: missing API key.');
            return false;
        }

        $normalizedNumber = UserProfile::normalizePhoneNumber($to);
        if (!$normalizedNumber) {
            Log::warning('Semaphore SMS sending skipped: invalid phone number.', [
                'number' => $to,
            ]);
            return false;
        }

        $payload = [
            'apikey'  => $apiKey,
            'number'  => $normalizedNumber,
            'message' => $message,
        ];

        $senderName = config('services.semaphore.sender');
        if ($senderName) {
            $payload['sendername'] = $senderName;
        }

        // Make the POST request to the Semaphore API
        $response = Http::asForm()->post('https://api.semaphore.co/api/v4/messages', $payload);

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
