<?php

namespace App\Services\IdentityVerification;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Throwable;

class IdDocumentPrecheckService
{
    public function __construct(
        private AiIdentityVerificationClient $client
    ) {}

    public function check(UploadedFile $file, ?string $validIdType, string $imageRole = 'front_id'): array
    {
        $imageRole = $this->normalizeImageRole($imageRole);

        if ($imageRole === 'selfie') {
            return $this->checkSelfie($file);
        }

        return $this->checkIdSide(
            $file,
            $validIdType,
            $imageRole,
            $imageRole === 'back_id' ? 'back' : 'front'
        );
    }

    private function checkIdSide(UploadedFile $file, ?string $validIdType, string $imageRole, string $documentSide): array
    {
        $documentType = $this->documentTypeFor($validIdType);

        if (!$documentType) {
            return $this->invalidIdResponse(
                $imageRole,
                $documentType,
                'Select a supported ID type before taking the photo.',
                ['id_unsupported_selected_type']
            );
        }

        try {
            $result = $this->client->extractOcrFromUpload($file, $documentType, $documentSide);
        } catch (Throwable $exception) {
            Log::warning('Registration ID precheck failed.', [
                'document_type' => $documentType,
                'image_role' => $imageRole,
                'error' => $exception->getMessage(),
            ]);

            return [
                'status' => 'unchecked',
                'is_valid' => null,
                'message' => "We could not validate the {$this->roleLabel($imageRole)} right now. Please retake a clear photo.",
                'image_role' => $imageRole,
                'document_type' => $documentType,
                'confidence' => null,
                'issues' => ['id_validation_unavailable'],
                'document_validation' => null,
                'diagnostics' => $this->diagnostics('/ocr/extract', $imageRole, [
                    'document_type' => $documentType,
                    'document_side' => $documentSide,
                    'exception' => $exception::class,
                    'error' => $exception->getMessage(),
                ]),
            ];
        }

        $validation = (array) data_get($result, 'document_validation', []);
        $issues = (array) data_get($result, 'issues', []);
        $confidence = (float) data_get($result, 'confidence', 0);
        $minimumConfidence = $documentSide === 'back'
            ? min(60.0, (float) config('identity_verification.thresholds.ocr_confidence_min', 70))
            : (float) config('identity_verification.thresholds.ocr_confidence_min', 70);

        if ($this->engineUnavailable($issues)) {
            return [
                'status' => 'unchecked',
                'is_valid' => null,
                'message' => "Automatic validation for the {$this->roleLabel($imageRole)} is unavailable. Please retake a clear photo.",
                'image_role' => $imageRole,
                'document_type' => $documentType,
                'confidence' => $confidence,
                'issues' => $issues,
                'fields' => data_get($result, 'fields', []),
                'document_validation' => $validation,
                'diagnostics' => $this->diagnostics('/ocr/extract', $imageRole, [
                    'document_type' => $documentType,
                    'document_side' => $documentSide,
                    'confidence' => $confidence,
                    'issues' => $issues,
                    'quality' => data_get($result, 'quality'),
                    'document_geometry' => data_get($result, 'document_geometry'),
                    'engine' => data_get($result, 'engine'),
                ]),
            ];
        }

        $criticalIssues = $this->criticalIdIssues($issues);
        $frontFieldsReadable = $documentSide !== 'front' || $this->frontFieldsReadable((array) data_get($result, 'fields', []));
        $isValid = data_get($validation, 'status') === 'passed'
            && data_get($validation, 'matches_expected_type') === true
            && $confidence >= $minimumConfidence
            && empty($criticalIssues)
            && $frontFieldsReadable;

        if ($isValid) {
            return [
                'status' => 'valid',
                'is_valid' => true,
                'message' => $imageRole === 'back_id' ? 'Back of ID looks valid.' : 'ID looks valid.',
                'image_role' => $imageRole,
                'document_type' => $documentType,
                'confidence' => $confidence,
                'issues' => $issues,
                'fields' => data_get($result, 'fields', []),
                'document_validation' => $validation,
                'diagnostics' => $this->diagnostics('/ocr/extract', $imageRole, [
                    'document_type' => $documentType,
                    'document_side' => $documentSide,
                    'confidence' => $confidence,
                    'issues' => $issues,
                    'quality' => data_get($result, 'quality'),
                    'document_geometry' => data_get($result, 'document_geometry'),
                    'detected_document_type' => data_get($validation, 'detected_document_type'),
                    'engine' => data_get($result, 'engine'),
                ]),
            ];
        }

        if (!$frontFieldsReadable) {
            $issues[] = 'id_required_fields_missing';
        }

        return [
            'status' => 'invalid',
            'is_valid' => false,
            'message' => $this->invalidIdMessage($imageRole, $validation, $issues, $confidence, $minimumConfidence),
            'image_role' => $imageRole,
            'document_type' => $documentType,
            'confidence' => $confidence,
            'issues' => array_values(array_unique($issues)),
            'fields' => data_get($result, 'fields', []),
            'document_validation' => $validation,
            'diagnostics' => $this->diagnostics('/ocr/extract', $imageRole, [
                'document_type' => $documentType,
                'document_side' => $documentSide,
                'confidence' => $confidence,
                'issues' => array_values(array_unique($issues)),
                'quality' => data_get($result, 'quality'),
                'document_geometry' => data_get($result, 'document_geometry'),
                'detected_document_type' => data_get($validation, 'detected_document_type'),
                'engine' => data_get($result, 'engine'),
            ]),
        ];
    }

    private function checkSelfie(UploadedFile $file): array
    {
        try {
            $result = $this->client->validateSelfieFromUpload($file);
        } catch (Throwable $exception) {
            Log::warning('Registration selfie precheck failed.', [
                'error' => $exception->getMessage(),
            ]);

            return [
                'status' => 'unchecked',
                'is_valid' => null,
                'message' => 'We could not validate the selfie right now. Please retake a clear face photo.',
                'image_role' => 'selfie',
                'score' => null,
                'issues' => ['selfie_validation_unavailable'],
                'diagnostics' => $this->diagnostics('/selfie/validate', 'selfie', [
                    'exception' => $exception::class,
                    'error' => $exception->getMessage(),
                ]),
            ];
        }

        $issues = (array) data_get($result, 'issues', []);
        $score = (float) data_get($result, 'score', 0);
        $minimumScore = (float) config('identity_verification.thresholds.liveness_min', 75);
        $isValid = data_get($result, 'status') === 'passed'
            && data_get($result, 'passed') === true
            && $score >= $minimumScore;

        return [
            'status' => $isValid ? 'valid' : 'invalid',
            'is_valid' => $isValid,
            'message' => $isValid ? 'Selfie looks valid.' : $this->invalidSelfieMessage($issues, $score, $minimumScore),
            'image_role' => 'selfie',
            'score' => $score,
            'issues' => $issues,
            'face_count' => data_get($result, 'face_count'),
            'quality' => data_get($result, 'quality'),
            'liveness' => data_get($result, 'liveness'),
            'diagnostics' => $this->diagnostics('/selfie/validate', 'selfie', [
                'score' => $score,
                'issues' => $issues,
                'face_count' => data_get($result, 'face_count'),
                'quality' => data_get($result, 'quality'),
                'liveness_score' => data_get($result, 'liveness.score'),
                'engine' => data_get($result, 'engine'),
            ]),
        ];
    }

    private function documentTypeFor(?string $validIdType): ?string
    {
        $normalized = strtolower((string) $validIdType);

        return match (true) {
            str_contains($normalized, 'passport') => 'passport',
            str_contains($normalized, 'license') => 'driver_license',
            str_contains($normalized, 'umid') || str_contains($normalized, 'unified multi') => 'umid',
            str_contains($normalized, 'philhealth') => 'philhealth_id',
            str_contains($normalized, 'postal') => 'postal_id',
            str_contains($normalized, 'voter') => 'voter_id',
            str_contains($normalized, 'prc') || str_contains($normalized, 'professional regulation') => 'prc_id',
            str_contains($normalized, 'philippine identification')
                || str_contains($normalized, 'philid')
                || str_contains($normalized, 'ephilid')
                || str_contains($normalized, 'national') => 'national_id',
            str_contains($normalized, 'school') || str_contains($normalized, 'student') => 'school_id',
            default => null,
        };
    }

    private function normalizeImageRole(?string $imageRole): string
    {
        return match ($imageRole) {
            'back_id', 'back' => 'back_id',
            'selfie', 'face' => 'selfie',
            default => 'front_id',
        };
    }

    private function engineUnavailable(array $issues): bool
    {
        return count(array_intersect($issues, [
            'id_ocr_engine_unavailable',
            'id_ocr_engine_failed',
            'id_validation_unavailable',
        ])) > 0;
    }

    private function criticalIdIssues(array $issues): array
    {
        return array_values(array_intersect($issues, [
            'id_low_resolution',
            'id_low_quality',
            'id_blurry',
            'id_bad_lighting',
        ]));
    }

    private function frontFieldsReadable(array $fields): bool
    {
        $hasIdNumber = filled(data_get($fields, 'id_number'));
        $readableFieldCount = collect([
            data_get($fields, 'full_name'),
            data_get($fields, 'id_number'),
            data_get($fields, 'birthdate'),
        ])->filter(fn ($value) => filled($value))->count();

        return $hasIdNumber && $readableFieldCount >= 2;
    }

    private function invalidIdMessage(
        string $imageRole,
        array $validation,
        array $issues,
        float $confidence,
        float $minimumConfidence
    ): string {
        if (in_array('id_no_readable_text', $issues, true)) {
            return "The {$this->roleLabel($imageRole)} text is not readable. Please retake a clearer photo.";
        }

        if (data_get($validation, 'is_identity_document') === false) {
            return "This image does not look like a valid {$this->roleLabel($imageRole)}. Please retake the photo.";
        }

        if (data_get($validation, 'is_supported_document') === false) {
            return 'This ID type is not supported for automatic validation. Please use another valid ID.';
        }

        if (data_get($validation, 'matches_expected_type') === false) {
            return 'Uploaded ID does not match selected ID type.';
        }

        if (in_array('id_required_fields_missing', $issues, true)) {
            return 'The ID details are not readable enough. Please retake the front photo.';
        }

        if (in_array('id_document_boundary_not_found', $issues, true)) {
            return "The whole {$this->roleLabel($imageRole)} is not clearly inside the frame. Please retake the photo.";
        }

        if (array_intersect($issues, ['id_low_resolution', 'id_low_quality', 'id_blurry', 'id_bad_lighting'])) {
            return "The {$this->roleLabel($imageRole)} photo is blurry, dark, or low quality. Please retake it.";
        }

        if ($confidence < $minimumConfidence) {
            return "The {$this->roleLabel($imageRole)} could not be validated clearly. Please retake the photo.";
        }

        return "The {$this->roleLabel($imageRole)} is not valid. Please retake the photo.";
    }

    private function invalidSelfieMessage(array $issues, float $score, float $minimumScore): string
    {
        if (in_array('selfie_no_face_detected', $issues, true)) {
            return 'No face was detected in the selfie. Please retake a clear face photo.';
        }

        if (in_array('selfie_multiple_faces_detected', $issues, true)) {
            return 'Only one face is allowed in the selfie. Please retake the photo alone.';
        }

        if (in_array('selfie_contains_id_document_text', $issues, true)) {
            return 'The selfie must be a face photo, not an ID photo. Please retake it.';
        }

        if (array_intersect($issues, ['selfie_low_resolution', 'selfie_low_quality', 'selfie_blurry', 'selfie_bad_lighting'])) {
            return 'The selfie is blurry, dark, or low quality. Please retake a clearer face photo.';
        }

        if (array_intersect($issues, ['selfie_face_too_small', 'selfie_face_too_close'])) {
            return 'Position your face clearly in the frame and retake the selfie.';
        }

        if (in_array('selfie_liveness_failed', $issues, true) || $score < $minimumScore) {
            return 'The selfie could not pass liveness checks. Please retake a live face photo.';
        }

        return 'The selfie is not valid. Please retake the photo.';
    }

    private function roleLabel(string $imageRole): string
    {
        return match ($imageRole) {
            'back_id' => 'back of ID',
            'selfie' => 'selfie',
            default => 'ID',
        };
    }

    private function invalidIdResponse(string $imageRole, ?string $documentType, string $message, array $issues): array
    {
        return [
            'status' => 'invalid',
            'is_valid' => false,
            'message' => $message,
            'image_role' => $imageRole,
            'document_type' => $documentType,
            'confidence' => null,
            'issues' => $issues,
            'document_validation' => null,
            'diagnostics' => $this->diagnostics('/ocr/extract', $imageRole, [
                'document_type' => $documentType,
                'issues' => $issues,
            ]),
        ];
    }

    private function diagnostics(string $endpoint, string $imageRole, array $context = []): ?array
    {
        if (!config('app.debug')) {
            return null;
        }

        return array_filter(array_merge([
            'ai_base_url' => config('identity_verification.ai.base_url'),
            'endpoint' => $endpoint,
            'image_role' => $imageRole,
        ], $context), fn ($value) => $value !== null);
    }
}
