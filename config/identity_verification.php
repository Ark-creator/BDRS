<?php

return [
    'storage' => [
        'disk' => env('IDENTITY_VERIFICATION_DISK', env('PRIVATE_UPLOADS_DISK', 's3-private')),
        'root' => env('IDENTITY_VERIFICATION_STORAGE_ROOT', 'verifications'),
        'temporary_url_minutes' => (int) env('IDENTITY_VERIFICATION_TEMP_URL_MINUTES', 10),
        'retention_days' => (int) env('IDENTITY_VERIFICATION_RETENTION_DAYS', 365),
    ],

    'uploads' => [
        'max_kilobytes' => (int) env('IDENTITY_VERIFICATION_MAX_UPLOAD_KB', 10240),
        'allowed_mimes' => ['jpeg', 'jpg', 'png', 'webp'],
        'id_min_width' => (int) env('IDENTITY_VERIFICATION_ID_MIN_WIDTH', 400),
        'id_min_height' => (int) env('IDENTITY_VERIFICATION_ID_MIN_HEIGHT', 250),
        'selfie_min_width' => (int) env('IDENTITY_VERIFICATION_SELFIE_MIN_WIDTH', 400),
        'selfie_min_height' => (int) env('IDENTITY_VERIFICATION_SELFIE_MIN_HEIGHT', 400),
        'max_width' => (int) env('IDENTITY_VERIFICATION_MAX_IMAGE_WIDTH', 1920),
        'jpeg_quality' => (int) env('IDENTITY_VERIFICATION_JPEG_QUALITY', 82),
    ],

    'security' => [
        'antivirus_enabled' => (bool) env('IDENTITY_VERIFICATION_ANTIVIRUS_ENABLED', false),
        'clamav_host' => env('IDENTITY_VERIFICATION_CLAMAV_HOST', '127.0.0.1'),
        'clamav_port' => (int) env('IDENTITY_VERIFICATION_CLAMAV_PORT', 3310),
        'clamav_timeout_seconds' => (int) env('IDENTITY_VERIFICATION_CLAMAV_TIMEOUT_SECONDS', 10),
    ],

    'document_types' => [
        'driver_license',
        'national_id',
        'umid',
        'philhealth_id',
        'postal_id',
        'voter_id',
        'prc_id',
        'school_id',
        'passport',
        'government_id',
    ],

    'queues' => [
        'processing' => env('IDENTITY_VERIFICATION_QUEUE', 'identity-verification'),
        'cleanup' => env('IDENTITY_VERIFICATION_CLEANUP_QUEUE', 'maintenance'),
    ],

    'wasm' => [
        'version' => env('IDENTITY_WASM_VERSION', 'v2'),
    ],

    'registration' => [
        'server_precheck_enabled' => (bool) env('IDENTITY_VERIFICATION_SERVER_PRECHECK_ENABLED', true),
    ],

    'ai' => [
        'base_url' => env('IDENTITY_AI_BASE_URL', 'http://127.0.0.1:8067'),
        'timeout_seconds' => (int) env('IDENTITY_AI_TIMEOUT_SECONDS', 30),
        'precheck_timeout_seconds' => (int) env('IDENTITY_AI_PRECHECK_TIMEOUT_SECONDS', 20),
        'retry_times' => (int) env('IDENTITY_AI_RETRY_TIMES', 2),
        'retry_sleep_ms' => (int) env('IDENTITY_AI_RETRY_SLEEP_MS', 500),
        'circuit_failure_threshold' => (int) env('IDENTITY_AI_CIRCUIT_FAILURE_THRESHOLD', 3),
        'circuit_cooldown_seconds' => (int) env('IDENTITY_AI_CIRCUIT_COOLDOWN_SECONDS', 60),
    ],

    'thresholds' => [
        'face_match_min' => (float) env('IDENTITY_VERIFICATION_FACE_MATCH_MIN', 82),
        'ocr_confidence_min' => (float) env('IDENTITY_VERIFICATION_OCR_MIN', 70),
        'liveness_min' => (float) env('IDENTITY_VERIFICATION_LIVENESS_MIN', 75),
        'fake_probability_max' => (float) env('IDENTITY_VERIFICATION_FAKE_MAX', 25),
        'overall_approve_min' => (float) env('IDENTITY_VERIFICATION_APPROVE_MIN', 85),
        'overall_review_min' => (float) env('IDENTITY_VERIFICATION_REVIEW_MIN', 60),
    ],
];
