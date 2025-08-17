<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

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
        $templateName = Str::snake(Str::lower($documentType->name)) . '_template.docx';
        $templatePath = storage_path("app/templates/{$templateName}");
        if (!file_exists($templatePath)) {
            return back()->with('error', "Template file not found: {$templateName}");
        }
        $templateProcessor = new TemplateProcessor($templatePath);
        $requestData = $documentRequest->form_data;
        $nameParts = array_filter([$profile->first_name, $profile->middle_name, $profile->last_name]);
        $fullName = strtoupper(implode(' ', $nameParts));
        $age = $profile->birthday ? Carbon::parse($profile->birthday)->age : 'N/A';
        $templateProcessor->setValue('FULL_NAME', $fullName);
        $templateProcessor->setValue('AGE', $age);
        $templateProcessor->setValue('PURPOSE', $requestData['purpose'] ?? 'N/A');
        $templateProcessor->setValue('DAY', date('jS'));
        $templateProcessor->setValue('MONTH_YEAR', date('F Y'));
        switch ($documentType->name) {
            case 'pwd':
                $disability = $requestData['disability_type'] ?? 'Not Specified';
                if ($disability === 'Others') {
                    $disability = $requestData['other_disability'] ?? 'Not Specified';
                }
                $templateProcessor->setValue('DISABILITY_TYPE', $disability);
                break;
        }
        $documentRequest->update(['status' => 'Ready for Pickup', 'processed_by' => auth()->id()]);
        $filePrefix = Str::studly($documentType->name);
        $fileName = "{$filePrefix}Cert_{$profile->last_name}.docx";
        $pathToSave = storage_path("app/public/{$fileName}");
        $templateProcessor->saveAs($pathToSave);
        return response()->download($pathToSave)->deleteFileAfterSend(true);
    }

    /**
     * Generate an HTML preview of the document.
     */
    public function preview(DocumentRequest $documentRequest): JsonResponse
    {
        $documentType = $documentRequest->documentType;
        if (!$documentType) {
            return response()->json(['error' => 'Missing document type.'], 404);
        }

        $profile = $documentRequest->user?->profile;
        if (!$profile) {
            return response()->json(['error' => 'User profile is incomplete.'], 404);
        }

        try {
            // --- DATA GATHERING ---
            $requestData = $documentRequest->form_data;
            $nameParts = array_filter([$profile->first_name, $profile->middle_name, $profile->last_name]);
            $fullName = strtoupper(implode(' ', $nameParts));
            $age = $profile->birthday ? Carbon::parse($profile->birthday)->age : 'N/A';
            $purpose = $requestData['purpose'] ?? 'N/A';
            $day = '17th'; 
            $monthYear = 'August 2025';

            // --- MANUAL HTML CONSTRUCTION WITH COLORS ---
            $htmlContent = "
                <div>
                    <p class='header'>Republic of the Philippines</p>
                    <p class='header'>PROVINCE OF NUEVA ECIJA</p>
                    <p class='header'>City of Gapan</p>

                    <p class='header' style='font-weight: bold; margin-top: 0.5cm; color: #D9853B;'>BARANGAY SAN LORENZO</p>
                    
                    <h1 class='document-title' style='color: #2E74B5;'>CERTIFICATE OF SOLO PARENT</h1>
                    
                    <p class='salutation'>TO WHOM IT MAY CONCERN:</p>
                    
                    <p class='body-content'>
                        This is to certify that <strong>{$fullName}</strong>, {$age} years of age, resident of Barangay San Lorenzo, Gapan City, Nueva Ecija personally known to me, belongs to an indigent family in this barangay.
                    </p>
                    
                    <p class='body-content'>
                        This certification is issued upon the request of the person named above for <strong>{$purpose}</strong> purposes.
                    </p>
                    
                    <p class='body-content'>
                        Issued on this <strong>{$day}</strong> day of <strong>{$monthYear}</strong> here at Barangay Hall of San Lorenzo, Gapan City, Nueva Ecija.
                    </p>
                    
                    <div class='signature-section'>
                        <div class='signature-block'>
                            <p>Certified by:</p>
                            <p class='signer-name'>WILLIAM DS. TIRRADO</p>
                            <p>Barangay Secretary</p>
                        </div>
                        <div class='signature-block' style='text-align: left;'>
                            <p>Approved by:</p>
                            <p class='signer-name'>PAUL MICHAEL A. AMPARADO</p>
                            <p>Punong Barangay</p>
                        </div>
                    </div>
                    
                    <p class='footer-note'>Not valid without the Barangay seal.</p>
                    <p class='header' style='font-size: 10pt; margin-top: 1cm;'>Bonifacio Street, San Lorenzo, Gapan City, Nueva Ecija, Philippines</p>
                </div>
            ";
            
            return response()->json(['html' => $htmlContent]);

        } catch (\Exception $e) {
            \Log::error('Document Preview Generation Failed: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while generating the preview.'], 500);
        }
    }
}
