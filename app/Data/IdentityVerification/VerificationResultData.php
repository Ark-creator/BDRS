<?php

namespace App\Data\IdentityVerification;

use App\Models\Verification;

class VerificationResultData
{
    public static function fromModel(Verification $verification): array
    {
        return [
            'id' => $verification->uuid,
            'status' => $verification->status,
            'document_type' => $verification->document_type,
            'scores' => [
                'face_match' => $verification->face_match_score,
                'ocr_confidence' => $verification->ocr_confidence,
                'fake_probability' => $verification->fake_probability,
                'liveness_score' => $verification->liveness_score,
                'overall_score' => $verification->overall_score,
            ],
            'extracted_data' => $verification->extracted_data,
            'document_validation' => $verification->document_validation,
            'failure_reason' => $verification->failure_reason,
            'submitted_at' => $verification->submitted_at,
            'processed_at' => $verification->processed_at,
            'reviewed_at' => $verification->reviewed_at,
        ];
    }
}
