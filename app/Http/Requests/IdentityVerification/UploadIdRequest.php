<?php

namespace App\Http\Requests\IdentityVerification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadIdRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'verification_id' => ['nullable', 'uuid', 'exists:verifications,uuid'],
            'document_type' => ['required', 'string', Rule::in(config('identity_verification.document_types', []))],
            'id_image' => [
                'required',
                'file',
                'image',
                'mimes:'.implode(',', config('identity_verification.uploads.allowed_mimes', [])),
                'max:'.(int) config('identity_verification.uploads.max_kilobytes', 10240),
                'dimensions:min_width='.(int) config('identity_verification.uploads.id_min_width', 400).',min_height='.(int) config('identity_verification.uploads.id_min_height', 250),
            ],
        ];
    }
}
