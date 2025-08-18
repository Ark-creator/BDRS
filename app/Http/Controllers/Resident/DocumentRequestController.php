<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DocumentRequestController extends Controller
{
    /**
     * Show the form to create a new document request.
     */
    public function create(DocumentType $documentType)
    {
        $componentName = Str::studly($documentType->name);
        $viewPath = 'Residents/papers/' . $componentName;

        return Inertia::render($viewPath, [
            'documentType' => $documentType,
        ]);
    }

    /**
     * Store a newly created document request in the database.
     */
    public function store(Request $request)
    
    {

            dd($request->all());

        $validated = $request->validate([
            'document_type_id' => 'required|exists:document_types,id',
            'disability_type' => 'nullable|string|max:255',
            'other_disability' => 'nullable|string|max:255',
            'signature_data' => 'nullable|string', // The base64 signature string
            'purpose' => 'nullable|string|max:255',
            'other_purpose' => 'nullable|string|max:255',
        ]);

        // Take all form inputs except token, doc type, and signature
        $formData = $request->except(['_token', 'document_type_id', 'signature_data']);

        // Handle "Others" in purpose
        if (isset($formData['purpose']) && $formData['purpose'] === 'Others') {
            $formData['purpose'] = $formData['other_purpose'] ?? 'Not specified';
        }
        unset($formData['other_purpose']);

        // --- Signature Handling ---
        if (!empty($validated['signature_data'])) {
            // 1. Decode base64 string
            $image = str_replace('data:image/png;base64,', '', $validated['signature_data']);
            $image = str_replace(' ', '+', $image);
            $imageData = base64_decode($image);

            // 2. Create filename and path
            $fileName = 'signature_' . auth()->id() . '_' . uniqid() . '.png';
            $directory = 'signatures';
            $signaturePath = $directory . '/' . $fileName;

            // 3. Store file
            Storage::disk('local')->put($signaturePath, $imageData);

            // **THE FIX: Add the signature path to the form data for the request**
            $formData['signature_path'] = $signaturePath;

            // 4. (Optional but good) Update the master signature on the user's profile
            $userProfile = auth()->user()->userProfile;
            if ($userProfile) {
                $userProfile->signature_data = $signaturePath;
                $userProfile->save();
            }
        }

        // --- Create the document request record ---
        DocumentRequest::create([
            'user_id'          => auth()->id(),
            'document_type_id' => $validated['document_type_id'],
            'status'           => 'pending',
            'form_data'        => $formData, // Now $formData includes the signature_path
        ]);

        return redirect()
            ->route('residents.home')
            ->with('success', 'Request submitted successfully!');
    }
}