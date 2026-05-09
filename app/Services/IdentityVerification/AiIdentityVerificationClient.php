<?php

namespace App\Services\IdentityVerification;

use App\Models\Verification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AiIdentityVerificationClient
{
    public function extractOcr(Verification $verification): array
    {
        return $this->postMultipart('/ocr/extract', [
            'image' => $verification->id_image_path,
        ]);
    }

    public function compareFaces(Verification $verification): array
    {
        return $this->postMultipart('/face/compare', [
            'id_image' => $verification->id_image_path,
            'selfie_image' => $verification->selfie_image_path,
        ]);
    }

    public function checkLiveness(Verification $verification): array
    {
        return $this->postMultipart('/liveness/check', [
            'selfie_image' => $verification->selfie_image_path,
        ]);
    }

    public function analyzeFraud(Verification $verification): array
    {
        return $this->postMultipart('/fraud/analyze', [
            'id_image' => $verification->id_image_path,
            'selfie_image' => $verification->selfie_image_path,
        ], [
            'id_image_hash' => $verification->id_image_hash,
            'selfie_image_hash' => $verification->selfie_image_hash,
        ]);
    }

    private function postMultipart(string $endpoint, array $files, array $payload = []): array
    {
        $this->ensureCircuitIsClosed();

        $disk = Storage::disk((string) config('identity_verification.storage.disk', 's3-private'));
        $request = Http::timeout((int) config('identity_verification.ai.timeout_seconds', 30))
            ->retry(
                (int) config('identity_verification.ai.retry_times', 2),
                (int) config('identity_verification.ai.retry_sleep_ms', 500)
            );

        foreach ($files as $field => $path) {
            if (!$path || !$disk->exists($path)) {
                throw new \RuntimeException("Verification image [{$field}] is missing.");
            }

            $request = $request->attach($field, $disk->get($path), basename($path));
        }

        try {
            $response = $request->post($this->baseUrl().$endpoint, $payload);
            $response->throw();
            $this->recordSuccess();
        } catch (Throwable $exception) {
            $this->recordFailure();
            throw $exception;
        }

        return $response->json() ?: [];
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('identity_verification.ai.base_url'), '/');
    }

    private function ensureCircuitIsClosed(): void
    {
        $openedUntil = Cache::get('identity-ai:circuit-open-until');
        if ($openedUntil && now()->lessThan($openedUntil)) {
            throw new \RuntimeException('Identity AI service circuit breaker is open.');
        }
    }

    private function recordFailure(): void
    {
        $failures = Cache::increment('identity-ai:failures');
        Cache::put('identity-ai:failures', $failures, now()->addMinutes(5));

        if ($failures >= (int) config('identity_verification.ai.circuit_failure_threshold', 3)) {
            Cache::put(
                'identity-ai:circuit-open-until',
                now()->addSeconds((int) config('identity_verification.ai.circuit_cooldown_seconds', 60)),
                now()->addSeconds((int) config('identity_verification.ai.circuit_cooldown_seconds', 60))
            );
        }
    }

    private function recordSuccess(): void
    {
        Cache::forget('identity-ai:failures');
        Cache::forget('identity-ai:circuit-open-until');
    }
}
