<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Carbon\Carbon;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Http\RedirectResponse; // Import RedirectResponse

class DocumentGenerationController extends Controller
{
    /**
     * Generate a Word document and update the request status.
     *
     * @param  \App\Models\DocumentRequest  $documentRequest
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|RedirectResponse
     */
    public function generate(DocumentRequest $documentRequest)
    {
        // --- NULL CHECK: Ensure the request is valid ---
        $documentType = $documentRequest->documentType;
        if (!$documentType) {
            return back()->with('error', 'The document request is missing a document type.');
        }

        $user = $documentRequest->user;
        if (!$user || !$user->profile) {
            return back()->with('error', "Generation failed: The user has not completed their profile information.");
        }
        $profile = $user->profile;

        // Get the template path
        $templateName = Str::snake(Str::lower($documentType->name)) . '_template.docx';
        $templatePath = storage_path("app/templates/{$templateName}");

        if (!file_exists($templatePath)) {
            return back()->with('error', "Template file not found: {$templateName}");
        }

        $templateProcessor = new TemplateProcessor($templatePath);
        $requestData = $documentRequest->form_data;

        // Build the full name robustly
        $nameParts = array_filter([$profile->first_name, $profile->middle_name, $profile->last_name]);
        $fullName = strtoupper(implode(' ', $nameParts));

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
            // Add more cases here
        }
        
        // --- BAGONG LOGIC: I-UPDATE ANG STATUS ---
        $documentRequest->update([
            'status' => 'Ready for Pickup',
            'processed_by' => auth()->id(),
        ]);

        // Define the download filename
        $filePrefix = Str::studly($documentType->name);
        $fileName = "{$filePrefix}Cert_{$profile->last_name}.docx";
        $pathToSave = storage_path("app/public/{$fileName}");

        // Save, download, and delete the temporary file
        $templateProcessor->saveAs($pathToSave);
        return response()->download($pathToSave)->deleteFileAfterSend(true);
    }
}
