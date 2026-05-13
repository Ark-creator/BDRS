<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\IdentityVerification\AiIdentityVerificationClient;
use App\Services\IdentityVerification\IdDocumentPrecheckService;
use App\Models\UserProfile; // Make sure you have a UserProfile model
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Throwable;

class ValidationController extends Controller
{
    /**
     * Check if a phone number is already taken.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkPhone(Request $request)
    {
        // 1. First, validate the input to ensure it's a valid format
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|min:10|max:20', // Basic sanity check
        ]);

        if ($validator->fails()) {
            // If input is invalid, report it as taken to prevent misuse
            return response()->json(['is_taken' => true]);
        }

        $normalizedPhoneNumber = UserProfile::normalizePhoneNumber($request->phone_number);
        if (!$normalizedPhoneNumber) {
            return response()->json(['is_taken' => true]);
        }

        // 2. Check if the phone number exists in the database
        $isTaken = UserProfile::where('phone_number', $normalizedPhoneNumber)->exists();

        // 3. Return a simple JSON response
        return response()->json([
            'is_taken' => $isTaken,
        ]);

    }

    public function checkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['is_taken' => true]);
        }
        
        // Check the 'users' table
        $isTaken = User::where('email', $request->email)->exists();

        return response()->json(['is_taken' => $isTaken]);
    }

    public function checkIdImage(Request $request, IdDocumentPrecheckService $precheck)
    {
        $imageRole = $request->input('image_role', 'front_id');
        $fileField = match ($imageRole) {
            'back_id', 'back' => 'valid_id_back_image',
            'selfie', 'face' => 'face_image',
            default => 'valid_id_front_image',
        };
        $file = $request->file($fileField) ?: $request->file('image');
        $validationData = array_merge($request->all(), [$fileField => $file]);
        $imageRules = [
            'required',
            'file',
            'image',
            'mimes:jpeg,png,jpg,webp',
            'max:10240',
            $fileField === 'face_image'
                ? 'dimensions:min_width=400,min_height=400'
                : 'dimensions:min_width=400,min_height=250',
        ];

        $validator = Validator::make($validationData, [
            'image_role' => 'nullable|string|in:front_id,front,back_id,back,selfie,face',
            'valid_id_type' => $fileField === 'face_image' ? 'nullable|string|max:255' : 'required|string|max:255',
            $fileField => $imageRules,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'invalid',
                'is_valid' => false,
                'message' => $fileField === 'face_image'
                    ? 'This selfie is too small or unreadable. Please retake a clearer face photo.'
                    : 'This ID photo is too small or unreadable. Please retake a clearer photo.',
                'image_role' => $imageRole,
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $precheck->check($file, $request->input('valid_id_type'), $imageRole);

        if (config('app.debug')) {
            $result['upload_diagnostics'] = $this->uploadDiagnostics($file);
        }

        return response()->json($result);
    }

    public function checkIdentityAiHealth(AiIdentityVerificationClient $client)
    {
        try {
            return response()->json([
                'status' => 'ok',
                'message' => 'Identity AI service is reachable.',
                'health' => $client->health(),
                'diagnostics' => config('app.debug') ? [
                    'ai_base_url' => config('identity_verification.ai.base_url'),
                    'precheck_timeout_seconds' => config('identity_verification.ai.precheck_timeout_seconds'),
                ] : null,
            ]);
        } catch (Throwable $exception) {
            return response()->json([
                'status' => 'unavailable',
                'message' => 'Identity AI service is not reachable.',
                'diagnostics' => config('app.debug') ? [
                    'ai_base_url' => config('identity_verification.ai.base_url'),
                    'error' => $exception->getMessage(),
                ] : null,
            ], 503);
        }
    }

    private function uploadDiagnostics($file): array
    {
        $dimensions = null;
        $path = $file?->getRealPath();
        if ($path) {
            $size = @getimagesize($path);
            if ($size) {
                $dimensions = [
                    'width' => $size[0],
                    'height' => $size[1],
                ];
            }
        }

        return [
            'client_name' => $file?->getClientOriginalName(),
            'mime_type' => $file?->getClientMimeType(),
            'size_bytes' => $file?->getSize(),
            'dimensions' => $dimensions,
        ];
    }

}
