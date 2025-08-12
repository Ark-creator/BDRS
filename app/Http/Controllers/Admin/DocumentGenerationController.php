<?php
// app/Http/Controllers/Admin/DocumentGenerationController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Carbon\Carbon;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Str; // Import Str facade for slug conversion if needed

class DocumentGenerationController extends Controller
{
    public function generate(DocumentRequest $documentRequest)
    {
        // ---- MODIFICATION ----
        // Check the document type using the relationship you created.
        // Let's assume your DocumentType has a 'slug' or 'name' field.
        if ($documentRequest->documentType->name !== 'Solo Parent') {
            abort(404, 'Invalid document type for this generation logic.');
        }

        $templatePath = storage_path('app/templates/solo_parent_template.docx');

        if (!file_exists($templatePath)) {
            abort(500, 'Template file not found.');
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        // Get user and profile data via the model relationships
        $user = $documentRequest->user;
        $profile = $user->profile;
        
        // ---- MODIFICATION ----
        // Access form_data directly as an array because of the $casts property
        $requestData = $documentRequest->form_data;

        // Prepare data for the template
        $fullName = strtoupper("{$profile->first_name} {$profile->middle_name} {$profile->last_name}");
        $age = Carbon::parse($profile->birthday)->age;

        // Replace placeholders in the template
        $templateProcessor->setValue('FULL_NAME', $fullName);
        $templateProcessor->setValue('AGE', $age);
        $templateProcessor->setValue('PURPOSE', $requestData['purpose']); // Accessing as an array key
        $templateProcessor->setValue('DAY', date('jS'));
        $templateProcessor->setValue('MONTH_YEAR', date('F Y'));
        
        // Define the name of the downloaded file
        $fileName = "SoloParentCert_{$profile->last_name}.docx";
        $pathToSave = storage_path("app/public/{$fileName}");

        // Save and download
        $templateProcessor->saveAs($pathToSave);
        return response()->download($pathToSave)->deleteFileAfterSend(true);
    }

    
}