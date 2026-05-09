<?php

namespace App\Http\Controllers\Api;

use App\Data\IdentityVerification\VerificationResultData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IdentityVerification\ProcessVerificationRequest;
use App\Http\Requests\IdentityVerification\UploadIdRequest;
use App\Http\Requests\IdentityVerification\UploadSelfieRequest;
use App\Models\Verification;
use App\Services\IdentityVerification\IdentityVerificationService;
use Illuminate\Http\JsonResponse;

class IdentityVerificationController extends Controller
{
    public function uploadId(UploadIdRequest $request, IdentityVerificationService $service): JsonResponse
    {
        $verification = $service->uploadId(
            $request->user(),
            (string) $request->input('document_type'),
            $request->file('id_image'),
            $request->input('verification_id'),
            $request
        );

        return response()->json([
            'verification_id' => $verification->uuid,
            'status' => $verification->status,
            'id_image_uploaded' => true,
        ], $request->filled('verification_id') ? 200 : 201);
    }

    public function uploadSelfie(UploadSelfieRequest $request, IdentityVerificationService $service): JsonResponse
    {
        $verification = Verification::where('uuid', $request->input('verification_id'))->firstOrFail();
        abort_unless($request->user()->can('update', $verification), 403);

        $verification = $service->uploadSelfie($request->user(), $verification, $request->file('selfie_image'), $request);

        return response()->json([
            'verification_id' => $verification->uuid,
            'status' => $verification->status,
            'selfie_image_uploaded' => true,
        ]);
    }

    public function process(ProcessVerificationRequest $request, IdentityVerificationService $service): JsonResponse
    {
        $verification = Verification::where('uuid', $request->input('verification_id'))->firstOrFail();
        abort_unless($request->user()->can('process', $verification), 403);

        $verification = $service->submitForProcessing($request->user(), $verification, $request);

        return response()->json([
            'verification_id' => $verification->uuid,
            'status' => $verification->status,
            'message' => 'Verification queued for AI processing.',
        ], 202);
    }

    public function status(Verification $verification): JsonResponse
    {
        return response()->json([
            'verification_id' => $verification->uuid,
            'status' => $verification->status,
            'submitted_at' => $verification->submitted_at,
            'processed_at' => $verification->processed_at,
            'overall_score' => $verification->overall_score,
            'failure_reason' => $verification->failure_reason,
        ]);
    }

    public function result(Verification $verification): JsonResponse
    {
        $verification->load(['faces', 'fraudAlerts' => fn ($query) => $query->latest()]);

        return response()->json(array_merge(VerificationResultData::fromModel($verification), [
            'faces' => $verification->faces,
            'fraud_alerts' => $verification->fraudAlerts,
        ]), $verification->isTerminal() ? 200 : 202);
    }
}
