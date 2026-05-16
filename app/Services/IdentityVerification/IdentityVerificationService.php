<?php

namespace App\Services\IdentityVerification;

use App\Events\IdentityVerificationReviewed;
use App\Events\IdentityVerificationSubmitted;
use App\Jobs\IdentityVerification\FaceVerificationJob;
use App\Jobs\IdentityVerification\FinalizeIdentityVerificationJob;
use App\Jobs\IdentityVerification\FraudAnalysisJob;
use App\Jobs\IdentityVerification\LivenessDetectionJob;
use App\Jobs\IdentityVerification\OCRProcessingJob;
use App\Models\User;
use App\Models\Verification;
use App\Repositories\IdentityVerification\VerificationRepository;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Validation\ValidationException;

class IdentityVerificationService
{
    public function __construct(
        private VerificationRepository $repository,
        private VerificationFileStorage $storage
    ) {}

    public function uploadId(User $user, string $documentType, UploadedFile $file, ?string $uuid = null, ?Request $request = null): Verification
    {
        $verification = $this->draftFor($user, $documentType, $uuid);
        $stored = $this->storage->storeImage($verification, $file, 'id');

        $this->storage->delete($verification->id_image_path);

        $verification->forceFill([
            'document_type' => $documentType,
            'status' => Verification::STATUS_DRAFT,
            'id_image_path' => $stored['path'],
            'id_image_hash' => $stored['hash'],
            'document_validation' => array_merge($verification->document_validation ?? [], [
                'id_image' => $stored['metadata'],
            ]),
            'failure_reason' => null,
        ])->save();

        $this->repository->recordLog($verification, 'id_uploaded', 'ID image uploaded for verification.', $user, 'info', [
            'metadata' => $stored['metadata'],
        ], $request);

        return $verification->refresh();
    }

    public function uploadSelfie(User $user, Verification $verification, UploadedFile $file, ?Request $request = null): Verification
    {
        $this->assertOwnedDraft($user, $verification);
        $stored = $this->storage->storeImage($verification, $file, 'selfie');

        $this->storage->delete($verification->selfie_image_path);

        $verification->forceFill([
            'status' => Verification::STATUS_DRAFT,
            'selfie_image_path' => $stored['path'],
            'selfie_image_hash' => $stored['hash'],
            'document_validation' => array_merge($verification->document_validation ?? [], [
                'selfie_image' => $stored['metadata'],
            ]),
            'failure_reason' => null,
        ])->save();

        $this->repository->recordLog($verification, 'selfie_uploaded', 'Selfie image uploaded for verification.', $user, 'info', [
            'metadata' => $stored['metadata'],
        ], $request);

        return $verification->refresh();
    }

    public function submitForProcessing(User $user, Verification $verification, ?Request $request = null): Verification
    {
        $this->assertOwnedDraft($user, $verification);

        if (!$verification->id_image_path || !$verification->selfie_image_path) {
            throw ValidationException::withMessages([
                'verification_id' => 'Both ID and selfie images are required before processing.',
            ]);
        }

        $status = config('identity_verification.wasm_mode', false)
            ? Verification::STATUS_PROCESSING
            : Verification::STATUS_QUEUED;

        $verification->forceFill([
            'status' => $status,
            'submitted_at' => now(),
            'failure_reason' => null,
        ])->save();

        $this->repository->recordLog($verification, 'submitted', 'Verification submitted for queued AI processing.', $user, 'info', [], $request);

        if (!config('identity_verification.wasm_mode', false)) {
            Bus::chain([
                new OCRProcessingJob($verification->id),
                new FaceVerificationJob($verification->id),
                new LivenessDetectionJob($verification->id),
                new FraudAnalysisJob($verification->id),
                new FinalizeIdentityVerificationJob($verification->id),
            ])->onQueue((string) config('identity_verification.queues.processing', 'identity-verification'))->dispatch();

            event(new IdentityVerificationSubmitted($verification->refresh(), $user));
        }

        return $verification->refresh();
    }

    public function review(Verification $verification, User $reviewer, string $status, ?string $notes = null, ?Request $request = null): Verification
    {
        $verification->forceFill([
            'status' => $status,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'review_notes' => $notes,
            'failure_reason' => $status === Verification::STATUS_REJECTED ? ($notes ?: $verification->failure_reason) : $verification->failure_reason,
        ])->save();

        $this->repository->recordLog($verification, 'manual_review', 'Verification was manually reviewed.', $reviewer, 'info', [
            'status' => $status,
            'notes' => $notes,
        ], $request);

        event(new IdentityVerificationReviewed($verification->refresh(), $reviewer));

        return $verification->refresh();
    }

    private function draftFor(User $user, string $documentType, ?string $uuid): Verification
    {
        if (!$uuid) {
            return $this->repository->createDraft($user, $documentType);
        }

        $verification = $this->repository->findForUserByUuid($user, $uuid);
        if (!$verification) {
            throw ValidationException::withMessages([
                'verification_id' => 'Verification not found.',
            ]);
        }

        $this->assertOwnedDraft($user, $verification);

        return $verification;
    }

    private function assertOwnedDraft(User $user, Verification $verification): void
    {
        if ((int) $verification->user_id !== (int) $user->id) {
            throw ValidationException::withMessages([
                'verification_id' => 'Verification not found.',
            ]);
        }

        if ($verification->isTerminal()) {
            throw ValidationException::withMessages([
                'verification_id' => 'Completed verifications cannot be modified. Start a new verification instead.',
            ]);
        }
    }
}
