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

        // --- Prepare data for the template ---
        $requestData = $documentRequest->form_data;
        $documentTypeName = strtolower($documentType->name);

        $isResidency = str_contains($documentTypeName, 'residency');
        if ($isResidency && empty($requestData['signature_path'])) {
            return back()->with('error', "Generation failed: The signature is missing from this document request.");
        }

        // --- Template Selection Logic ---
        $isEdukDocument = str_contains($documentTypeName, 'eduk') || str_contains($documentTypeName, 'pagpapatunay');
        $isOathDocument = str_contains($documentTypeName, 'oath') || str_contains($documentTypeName, 'undertaking');
        
        if ($isEdukDocument) {
            $templateName = 'pagpapatunay_eduk.docx';
        } elseif ($isOathDocument) {
            $templateName = 'oath_of_undertaking.docx';
        } else {
            $templateName = Str::snake($documentTypeName) . '_template.docx';
        }
        
        $templatePath = storage_path("app/templates/{$templateName}");

        if (!file_exists($templatePath)) {
            return back()->with('error', "Template file not found: {$templateName}");
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        // --- Prepare and Set Common Values ---
        $nameParts = array_filter([$profile->first_name, $profile->middle_name, $profile->last_name]);
        $fullName = strtoupper(implode(' ', $nameParts));
        
        $templateProcessor->setValue('FULL_NAME', $fullName);
        $templateProcessor->setValue('AGE', $profile->birthday ? Carbon::parse($profile->birthday)->age : 'N/A');
        $templateProcessor->setValue('ADDRESS', $profile->address ?? 'N/A');
        $templateProcessor->setValue('DAY', date('jS'));
        $templateProcessor->setValue('MONTH_YEAR', date('F Y'));
        $templateProcessor->setValue('CURRENT_DATE', date('F j, Y'));

        // --- SET DOCUMENT-SPECIFIC VALUES (CONSOLIDATED) ---
        // Lahat ng logic para sa pag-set ng data ay nasa iisang switch block na.
        switch ($documentType->name) {
            // NOTE: Palitan ang string sa case ng eksaktong pangalan sa iyong database.
            case 'Pagpapatunay Eduk': 
                $templateProcessor->setValue('SCHOOL_NAME', $requestData['school_name'] ?? 'N/A');
                $templateProcessor->setValue('SCHOOL_ADDRESS', $requestData['school_address'] ?? 'N/A');
                $templateProcessor->setValue('COURSE_PROGRAM', $requestData['course_program'] ?? 'N/A');
                $templateProcessor->setValue('YEAR_LEVEL', $requestData['year_level'] ?? 'N/A');
                $templateProcessor->setValue('ACADEMIC_YEAR', $requestData['academic_year'] ?? 'N/A');
                $templateProcessor->setValue('PURPOSE', $requestData['purpose'] ?? 'N/A');
                break;

            // NOTE: Palitan ang string sa case ng eksaktong pangalan sa iyong database.
            case 'Oath of Undertaking':
                $templateProcessor->setValue('PURPOSE', $requestData['purpose'] ?? 'N/A');
                $templateProcessor->setValue('SPECIFIC_UNDERTAKING', $requestData['specific_undertaking'] ?? 'N/A');
                break;
                
            case 'Mayors Business Permit':
                $templateProcessor->setValue('BUSINESS_NAME', $requestData['business_name'] ?? 'N/A');
                $templateProcessor->setValue('BUSINESS_ADDRESS', $requestData['business_address'] ?? 'N/A');
                break;

            case 'Job Seeker':
                $templateProcessor->setValue('YEARS_QUALIFIED', $requestData['years_qualified'] ?? 'N/A');
                break;
            
            case 'pwd':
                $disability = $requestData['disability_type'] ?? 'Not Specified';
                if ($disability === 'Others') {
                    $disability = $requestData['other_disability'] ?? 'Not Specified';
                }
                $templateProcessor->setValue('DISABILITY_TYPE', $disability);
                break;

            case 'GP Indigency':
            case 'Solo Parent':
                $templateProcessor->setValue('PURPOSE', $requestData['purpose'] ?? 'N/A');
                break;
        }

        // --- Signature Injection ---
        $signaturePath = $requestData['signature_path'] ?? null;
        if (($isResidency || $isOathDocument) && $signaturePath) {
            $signatureFullPath = storage_path('app/private/' . $signaturePath);

            if (file_exists($signatureFullPath)) {
                $templateProcessor->setImageValue('USER_SIGNATURE', [
                    'path' => $signatureFullPath,
                    'width' => 100,
                    'height' => 50,
                    'ratio' => true
                ]);
            } else {
                return back()->with('error', 'Generation failed: Signature file not found on server.');
            }
        }

        // --- Finalize and Download ---
        $documentRequest->update(['status' => 'Ready for Pickup', 'processed_by' => auth()->id()]);
        
        $filePrefix = Str::studly($documentType->name);
        $fileName = "{$filePrefix}Cert_{$profile->last_name}.docx";
        $pathToSave = storage_path("app/public/generated/{$fileName}");

        if (!is_dir(dirname($pathToSave))) {
            mkdir(dirname($pathToSave), 0755, true);
        }

        $templateProcessor->saveAs($pathToSave);

        return response()->download($pathToSave)->deleteFileAfterSend(true);
    }
}