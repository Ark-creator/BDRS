<?php

// FILE: app/Http/Controllers/Admin/DocumentGenerationController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Carbon\Carbon;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class DocumentGenerationController extends Controller
{
    /**
     * Generate a Word document and update the request status.
     */
    public function generate(DocumentRequest $documentRequest)
    {
        $documentType = $documentRequest->documentType;
        if (!$documentType) {
            return back()->with('error', 'The document request is missing a document type.');
        }

        $profile = $documentRequest->user?->profile;
        if (!$profile) {
            return back()->with('error', "Generation failed: The user has not completed their profile information.");
        }

        // --- START: SIGNATURE VALIDATION ---
        // Check if the document requires a signature and if it exists in the user's profile.
        $isResidency = str_contains(strtolower($documentType->name), 'residency');
        if ($isResidency && empty($profile->signature_data)) {
            return back()->with('error', "Generation failed: The user's signature is missing from their profile.");
        }
        // --- END: SIGNATURE VALIDATION ---

        // Construct template path from document type name
        $templateName = Str::snake(Str::lower($documentType->name)) . '_template.docx';
        $templatePath = storage_path("app/templates/{$templateName}");

        if (!file_exists($templatePath)) {
            return back()->with('error', "Template file not found: {$templateName}");
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        // --- Prepare data for the template ---
        $requestData = $documentRequest->form_data;
        $nameParts = array_filter([$profile->first_name, $profile->middle_name, $profile->last_name]);
        $fullName = strtoupper(implode(' ', $nameParts));
        $age = $profile->birthday ? Carbon::parse($profile->birthday)->age : 'N/A';

        // --- Set common values in the template ---
        $templateProcessor->setValue('FULL_NAME', $fullName);
        $templateProcessor->setValue('AGE', $age);
        $templateProcessor->setValue('DAY', date('jS'));
        $templateProcessor->setValue('MONTH_YEAR', date('F Y'));

        // --- Set document-specific values ---
        switch ($documentType->name) {
            case 'pwd':
                $disability = $requestData['disability_type'] ?? 'Not Specified';
                if ($disability === 'Others') {
                    $disability = $requestData['other_disability'] ?? 'Not Specified';
                }
                $templateProcessor->setValue('DISABILITY_TYPE', $disability);
                break;

            case 'GP Indigency':
                $purpose = $requestData['purpose'] ?? 'N/A';
                $templateProcessor->setValue('PURPOSE', $purpose);
                break;
        }

        // --- CORRECT SIGNATURE INJECTION ---
        // This is the only block needed. It reads the signature path from the user's profile
        // and injects the saved image file directly into the Word document.
        if ($isResidency && $profile->signature_data) {
            $signatureFullPath = storage_path('app/public/' . $profile->signature_data);
            if (file_exists($signatureFullPath)) {
                $templateProcessor->setImageValue('USER_SIGNATURE', [
                    'path' => $signatureFullPath,
                    'width' => 150,
                    'height' => 75,
                    'ratio' => false
                ]);
            } else {
                // Optional: Handle cases where the path exists in DB but file is missing
                // For now, it will just skip adding the image. You could add an error here.
            }
        }

        // Update the request status
        $documentRequest->update(['status' => 'Ready for Pickup', 'processed_by' => auth()->id()]);
        
        // Prepare file for download
        $filePrefix = Str::studly($documentType->name);
        $fileName = "{$filePrefix}Cert_{$profile->last_name}.docx";
        $pathToSave = storage_path("app/public/generated/{$fileName}");

        // Ensure the generated directory exists
        if (!is_dir(dirname($pathToSave))) {
            mkdir(dirname($pathToSave), 0755, true);
        }

        $templateProcessor->saveAs($pathToSave);

        return response()->download($pathToSave)->deleteFileAfterSend(true);
    }
}
