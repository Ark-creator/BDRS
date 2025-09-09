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
        $isResidency = str_contains(strtolower($documentType->name), 'residency');
        
        // Require signature if residency type
        if ($isResidency && empty($requestData['signature_path'])) {
            return back()->with('error', "Generation failed: The signature is missing from this document request.");
        }

        // Check if this is the specific eduk template
        $isEdukDocument = str_contains(strtolower($documentType->name), 'eduk') || 
                          str_contains(strtolower($documentType->name), 'pagpapatunay');
        
        // Check if this is the oath of undertaking template
        $isOathDocument = str_contains(strtolower($documentType->name), 'oath') || 
                          str_contains(strtolower($documentType->name), 'undertaking');
        
        // Use specific template for different document types
        if ($isEdukDocument) {
            $templateName = 'pagpapatunay_eduk.docx';
        } elseif ($isOathDocument) {
            $templateName = 'oath_of_undertaking.docx';
        } else {
            $templateName = Str::snake(Str::lower($documentType->name)) . '_template.docx';
        }
        
        $templatePath = storage_path("app/templates/{$templateName}");

        if (!file_exists($templatePath)) {
            return back()->with('error', "Template file not found: {$templateName}");
        }

        $templateProcessor = new TemplateProcessor($templatePath);

        // --- Prepare common data values ---
        $nameParts = array_filter([$profile->first_name, $profile->middle_name, $profile->last_name]);
        $fullName = strtoupper(implode(' ', $nameParts));
        $age = $profile->birthday ? Carbon::parse($profile->birthday)->age : 'N/A';
        $address = $profile->address ?? 'N/A';

        // --- Set common values in the template ---
        $templateProcessor->setValue('FULL_NAME', $fullName);
        $templateProcessor->setValue('AGE', $age);
        $templateProcessor->setValue('ADDRESS', $address);
        $templateProcessor->setValue('DAY', date('jS'));
        $templateProcessor->setValue('MONTH_YEAR', date('F Y'));
        $templateProcessor->setValue('CURRENT_DATE', date('F j, Y'));

        // --- SPECIAL HANDLING FOR PAGPAPATUNAY EDUK DOCUMENT ---
        if ($isEdukDocument) {
            $templateProcessor->setValue('SCHOOL_NAME', $requestData['school_name'] ?? 'N/A');
            $templateProcessor->setValue('SCHOOL_ADDRESS', $requestData['school_address'] ?? 'N/A');
            $templateProcessor->setValue('COURSE_PROGRAM', $requestData['course_program'] ?? 'N/A');
            $templateProcessor->setValue('YEAR_LEVEL', $requestData['year_level'] ?? 'N/A');
            $templateProcessor->setValue('ACADEMIC_YEAR', $requestData['academic_year'] ?? 'N/A');
            $templateProcessor->setValue('PURPOSE', $requestData['purpose'] ?? 'N/A');
        }

        // --- SPECIAL HANDLING FOR OATH OF UNDERTAKING DOCUMENT ---
        if ($isOathDocument) {
            $templateProcessor->setValue('PURPOSE', $requestData['purpose'] ?? 'N/A');
            $templateProcessor->setValue('SPECIFIC_UNDERTAKING', $requestData['specific_undertaking'] ?? 'N/A');
        }

        // --- Set document-specific values for other document types ---
        switch ($documentType->name) {
            case 'Brgy Business Permit':
                $businessName = $requestData['business_name'] ?? 'N/A';
                $businessAddress = $requestData['business_address'] ?? 'N/A';
                $templateProcessor->setValue('BUSINESS_NAME', $businessName);
                $templateProcessor->setValue('BUSINESS_ADDRESS', $businessAddress);
                break;

            case 'Job Seeker':
                $years = $requestData['years_qualified'] ?? 'N/A';
                $templateProcessor->setValue('YEARS_QUALIFIED', $years);
                break;

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

            case 'Solo Parent':
                $purpose = $requestData['purpose'] ?? 'N/A';
                $templateProcessor->setValue('PURPOSE', $purpose);
                break;
        }

        // --- FIXED SIGNATURE INJECTION ---
        $signaturePath = $requestData['signature_path'] ?? null;

        if (($isResidency || $isOathDocument) && $signaturePath) {
            // always look inside storage/app/private/
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

        // Update the request status
        $documentRequest->update(['status' => 'Ready for Pickup', 'processed_by' => auth()->id()]);
        
        // Prepare file for download
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
