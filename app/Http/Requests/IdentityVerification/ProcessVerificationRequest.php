<?php

namespace App\Http\Requests\IdentityVerification;

use Illuminate\Foundation\Http\FormRequest;

class ProcessVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'verification_id' => ['required', 'uuid', 'exists:verifications,uuid'],
        ];
    }
}
