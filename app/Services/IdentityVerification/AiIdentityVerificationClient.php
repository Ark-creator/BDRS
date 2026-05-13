<?php

namespace App\Services\IdentityVerification;

use App\Models\Verification;
use Illuminate\Http\UploadedFile;
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
        ], [
            'document_type' => $verification->document_type,
            'document_side' => 'front',
        ]);
    }

    public function extractOcrFromUpload(UploadedFile $file, ?string $documentType = null, ?string $documentSide = null): array
    {
        return $this->postMultipartUploads('/ocr/extract', [
            'image' => $file,
        ], array_filter([
            'document_type' => $documentType,
            'document_side' => $documentSide,
        ]), (int) config('identity_verification.ai.precheck_timeout_seconds', 20), 0);
    }

    public function validateSelfieFromUpload(UploadedFile $file): array
    {
        return $this->postMultipartUploads('/selfie/validate', [
            'image' => $file,
        ], [], (int) config('identity_verification.ai.precheck_timeout_seconds', 20), 0);
    }

    public function health(): array
    {
        $response = $this->request(5, 0)->get($this->baseUrl().'/health');
        $response->throw();

        return $response->json() ?: [];
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

    private function postMultipart(string $endpoint, array $files, array $payload = [], ?int $timeoutSeconds = null, ?int $retryTimes = null): array
    {
        $this->ensureCircuitIsClosed();

        $disk = Storage::disk((string) config('identity_verification.storage.disk', 's3-private'));
        $request = $this->request($timeoutSeconds, $retryTimes);

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

    private function postMultipartUploads(string $endpoint, array $files, array $payload = [], ?int $timeoutSeconds = null, ?int $retryTimes = null): array
    {
        $this->ensureCircuitIsClosed();

        $request = $this->request($timeoutSeconds, $retryTimes);

        foreach ($files as $field => $file) {
            $path = $file->getRealPath();
            $contents = $path ? file_get_contents($path) : false;
            if ($contents === false) {
                throw new \RuntimeException("Verification image [{$field}] is unreadable.");
            }

            $request = $request->attach($field, $contents, $file->getClientOriginalName() ?: "{$field}.jpg");
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

    private function request(?int $timeoutSeconds = null, ?int $retryTimes = null): \Illuminate\Http\Client\PendingRequest
    {
        return Http::timeout($timeoutSeconds ?? (int) config('identity_verification.ai.timeout_seconds', 30))
            ->retry(
                $retryTimes ?? (int) config('identity_verification.ai.retry_times', 2),
                (int) config('identity_verification.ai.retry_sleep_ms', 500)
            );
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
