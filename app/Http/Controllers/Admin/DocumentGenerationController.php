<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Carbon\Carbon;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;

class DocumentGenerationController extends Controller
{
    /**
     * Generate a Word document based on a document request.
     *
     * @param  \App\Models\DocumentRequest  $documentRequest
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function generate(DocumentRequest $documentRequest)
    {
        // --- NULL CHECK: Ensure the request is valid ---
        $documentType = $documentRequest->documentType;
        if (!$documentType) {
            abort(500, 'The document request is missing a document type.');
        }

        $user = $documentRequest->user;
        if (!$user) {
            abort(500, 'The document request is not associated with a user.');
        }

        // --- PRIMARY NULL CHECK: Ensure the user has a profile ---
        $profile = $user->profile;
        if (!$profile) {
            abort(500, "Generation failed: The user '{$user->email}' has not completed their profile information.");
        }

        // Get the template path using a dynamic name
        $templateName = Str::snake(Str::lower($documentType->name)) . '_template.docx';
        $templatePath = storage_path("app/templates/{$templateName}");

        if (!file_exists($templatePath)) {
            abort(500, "Template file not found: {$templateName}");
        }

        $templateProcessor = new TemplateProcessor($templatePath);
        $requestData = $documentRequest->form_data;

        // --- DYNAMIC & NULL-SAFE: Build the full name robustly ---
        // This filters out empty/null parts (like middle_name) to prevent extra spaces
        $nameParts = array_filter([$profile->first_name, $profile->middle_name, $profile->last_name]);
        $fullName = strtoupper(implode(' ', $nameParts));

        // Safely calculate age, providing a default if birthday is null
        $age = $profile->birthday ? Carbon::parse($profile->birthday)->age : 'N/A';

        // Set common placeholders
        $templateProcessor->setValue('FULL_NAME', $fullName);
        $templateProcessor->setValue('AGE', $age);
        $templateProcessor->setValue('PURPOSE', $requestData['purpose'] ?? 'N/A');
        $templateProcessor->setValue('DAY', date('jS'));
        $templateProcessor->setValue('MONTH_YEAR', date('F Y'));

        // Set document-specific placeholders
        switch ($documentType->name) {
            case 'pwd':
                $disability = $requestData['disability_type'] ?? 'Not Specified';
                if ($disability === 'Others') {
                    $disability = $requestData['other_disability'] ?? 'Not Specified';
                }
                $templateProcessor->setValue('DISABILITY_TYPE', $disability);
                break;

            case 'Solo Parent':
                // No document-specific fields needed here
                break;
            
            // Add more 'case' blocks here for other document types
        }

        // Dynamically define the download filename
        $filePrefix = Str::studly($documentType->name);
        $fileName = "{$filePrefix}Cert_{$profile->last_name}.docx";
        $pathToSave = storage_path("app/public/{$fileName}");

        // Save, download, and delete the temporary file
        $templateProcessor->saveAs($pathToSave);
        return response()->download($pathToSave)->deleteFileAfterSend(true);
    }
}