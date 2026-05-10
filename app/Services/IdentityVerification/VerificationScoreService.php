<?php

namespace App\Services\IdentityVerification;

use App\Models\Verification;
use Illuminate\Support\Arr;

class VerificationScoreService
{
    public function finalize(Verification $verification): Verification
    {
        $scores = $verification->scores ?? [];
        $face = (float) ($verification->face_match_score ?? Arr::get($scores, 'face.similarity', 0));
        $ocr = (float) ($verification->ocr_confidence ?? Arr::get($scores, 'ocr.confidence', 0));
        $liveness = (float) ($verification->liveness_score ?? Arr::get($scores, 'liveness.score', 0));
        $fakeProbability = (float) ($verification->fake_probability ?? Arr::get($scores, 'fraud.fake_probability', 100));

        $overall = round(($face * 0.35) + ($ocr * 0.20) + ($liveness * 0.25) + ((100 - $fakeProbability) * 0.20), 2);
        $status = $this->statusFor($verification, $face, $ocr, $liveness, $fakeProbability, $overall);

        $verification->forceFill([
            'overall_score' => $overall,
            'status' => $status,
            'processed_at' => now(),
            'failure_reason' => $status === Verification::STATUS_REJECTED
                ? $this->rejectionReason($verification, $face, $ocr, $liveness, $fakeProbability)
                : null,
        ])->save();

        return $verification->refresh();
    }

    private function statusFor(
        Verification $verification,
        float $face,
        float $ocr,
        float $liveness,
        float $fakeProbability,
        float $overall
    ): string {
        if ($verification->id_expires_at && $verification->id_expires_at->isPast()) {
            return Verification::STATUS_REJECTED;
        }

        if ($this->documentValidationFailed($verification)) {
            return Verification::STATUS_REJECTED;
        }

        $passesHardRules = $face >= (float) config('identity_verification.thresholds.face_match_min')
            && $ocr >= (float) config('identity_verification.thresholds.ocr_confidence_min')
            && $liveness >= (float) config('identity_verification.thresholds.liveness_min')
            && $fakeProbability <= (float) config('identity_verification.thresholds.fake_probability_max');

        if ($passesHardRules && $overall >= (float) config('identity_verification.thresholds.overall_approve_min')) {
            return Verification::STATUS_APPROVED;
        }

        if ($overall >= (float) config('identity_verification.thresholds.overall_review_min')) {
            return Verification::STATUS_REVIEW_REQUIRED;
        }

        return Verification::STATUS_REJECTED;
    }

    private function rejectionReason(Verification $verification, float $face, float $ocr, float $liveness, float $fakeProbability): string
    {
        if ($verification->id_expires_at && $verification->id_expires_at->isPast()) {
            return 'The submitted ID is expired.';
        }

        if ($reason = $this->documentValidationRejectionReason($verification)) {
            return $reason;
        }

        if ($face < (float) config('identity_verification.thresholds.face_match_min')) {
            return 'The selfie face does not sufficiently match the ID face.';
        }

        if ($liveness < (float) config('identity_verification.thresholds.liveness_min')) {
            return 'The selfie failed liveness checks.';
        }

        if ($fakeProbability > (float) config('identity_verification.thresholds.fake_probability_max')) {
            return 'The ID image has a high fraud probability.';
        }

        if ($ocr < (float) config('identity_verification.thresholds.ocr_confidence_min')) {
            return 'The ID text could not be read with enough confidence.';
        }

        return 'The verification did not meet the minimum confidence threshold.';
    }

    private function documentValidationFailed(Verification $verification): bool
    {
        $validation = $this->documentValidation($verification);
        $criticalIssues = $this->criticalIssues($verification);

        return Arr::get($validation, 'is_identity_document') === false
            || Arr::get($validation, 'is_supported_document') === false
            || Arr::get($validation, 'matches_expected_type') === false
            || count($criticalIssues) > 0;
    }

    private function documentValidationRejectionReason(Verification $verification): ?string
    {
        $validation = $this->documentValidation($verification);
        $issues = Arr::get($validation, 'issues', []);
        $criticalIssues = $this->criticalIssues($verification);

        if (in_array('id_no_readable_text', $issues, true)) {
            return 'The ID text could not be read well enough to validate the document.';
        }

        if (Arr::get($validation, 'is_identity_document') === false) {
            return 'The submitted image does not look like an identity document.';
        }

        if (Arr::get($validation, 'is_supported_document') === false) {
            return 'The submitted ID type is not supported for automatic verification.';
        }

        if (Arr::get($validation, 'matches_expected_type') === false) {
            return 'The submitted ID does not match the selected document type.';
        }

        if (count(array_intersect($criticalIssues, ['id_document_boundary_not_found', 'id_edge_incomplete', 'id_possible_crop'])) > 0) {
            return 'The ID image was cropped or not fully inside the frame.';
        }

        if (count(array_intersect($criticalIssues, ['id_glare', 'id_low_light'])) > 0) {
            return 'The ID image has glare or low lighting that prevents validation.';
        }

        if (count(array_intersect($criticalIssues, ['id_screen_capture_risk', 'id_recapture_risk', 'id_tamper_suspected', 'id_screenshot_suspected', 'id_recapture_suspected'])) > 0) {
            return 'The ID image appears tampered or recaptured.';
        }

        return null;
    }

    private function documentValidation(Verification $verification): array
    {
        return $verification->document_validation
            ?? Arr::get($verification->scores ?? [], 'ocr.document_validation', [])
            ?? [];
    }

    private function criticalIssues(Verification $verification): array
    {
        $scores = $verification->scores ?? [];
        $ocrIssues = Arr::get($scores, 'ocr.issues', []);
        $fraudIssues = Arr::get($scores, 'fraud.issues', []);
        $livenessIssues = Arr::get($scores, 'liveness.issues', []);

        return array_values(array_unique(array_merge(
            array_intersect((array) $ocrIssues, [
                'id_document_boundary_not_found',
                'id_possible_crop',
                'id_edge_incomplete',
                'id_glare',
                'id_low_light',
                'id_screen_capture_risk',
                'id_recapture_risk',
            ]),
            array_intersect((array) $fraudIssues, [
                'id_tamper_suspected',
                'id_screenshot_suspected',
                'id_recapture_suspected',
            ]),
            array_intersect((array) $livenessIssues, [
                'selfie_screen_replay_risk',
                'selfie_recapture_risk',
            ])
        )));
    }
}
