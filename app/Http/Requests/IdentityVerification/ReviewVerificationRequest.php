<?php

namespace App\Http\Requests\IdentityVerification;

use App\Models\Verification;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\RequiredIf;

class ReviewVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $verification = $this->route('verification');

        return $this->user()?->can('review', $verification) ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                Verification::STATUS_APPROVED,
                Verification::STATUS_REJECTED,
                Verification::STATUS_REVIEW_REQUIRED,
            ])],
            'notes' => [
                new RequiredIf($this->input('status') === Verification::STATUS_REJECTED),
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}
