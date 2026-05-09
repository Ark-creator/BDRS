<?php

namespace App\Http\Requests\IdentityVerification;

use Illuminate\Foundation\Http\FormRequest;

class UploadSelfieRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'verification_id' => ['required', 'uuid', 'exists:verifications,uuid'],
            'selfie_image' => [
                'required',
                'file',
                'image',
                'mimes:'.implode(',', config('identity_verification.uploads.allowed_mimes', [])),
                'max:'.(int) config('identity_verification.uploads.max_kilobytes', 10240),
                'dimensions:min_width='.(int) config('identity_verification.uploads.selfie_min_width', 400).',min_height='.(int) config('identity_verification.uploads.selfie_min_height', 400),
            ],
        ];
    }
}
