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
            return response()->json(['error' => 'Missing document type.'], 500);
        }

        $profile = $documentRequest->user?->profile;
        if (!$profile) {
            return response()->json(['error' => 'User profile is incomplete.'], 500);
        }

        $templateName = Str::snake(Str::lower($documentType->name)) . '_template.docx';
        $templatePath = storage_path("app/templates/{$templateName}");

        if (!file_exists($templatePath)) {
            return response()->json(['error' => "Template file not found: {$templateName}"], 500);
        }

        try {
            $templateProcessor = new TemplateProcessor($templatePath);
            $requestData = $documentRequest->form_data;
            
            // --- INAYOS NA BAHAGI: Kinopya ang kumpletong logic mula sa 'generate' ---
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
                // Add more 'case' blocks here for other document types
            }
            // --- WAKAS NG INAYOS NA BAHAGI ---

            // --- Logic para i-convert ang DOCX to HTML ---
            $tempDir = storage_path('app/temp');
            if (!File::isDirectory($tempDir)) {
                File::makeDirectory($tempDir, 0755, true, true);
            }

            $tempDocxPath = $tempDir . '/' . uniqid() . '.docx';
            $templateProcessor->saveAs($tempDocxPath);

            $phpWord = IOFactory::load($tempDocxPath);
            $htmlWriter = IOFactory::createWriter($phpWord, 'HTML');
            
            $tempHtmlPath = $tempDir . '/' . uniqid() . '.html';
            $htmlWriter->save($tempHtmlPath);

            $htmlContent = file_get_contents($tempHtmlPath);

            // Linisin ang temporary files
            unlink($tempDocxPath);
            unlink($tempHtmlPath);

            return response()->json(['html' => $htmlContent]);

        } catch (\Exception $e) {
            // Mag-log ng error para sa debugging
            \Log::error('Document Preview Generation Failed: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while generating the preview.'], 500);
        }
    }
}
