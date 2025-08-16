<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\DocumentType; // Import the DocumentType model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str; // <-- Make sure to import the Str facade


class DocumentRequestController extends Controller
{
    /**
     * Show the form to create a new document request.
     * This method receives the DocumentType model directly from the URL
     * thanks to Laravel's route model binding.
     */
   public function create(DocumentType $documentType)
    {
        // 1. Get the document name from the database (e.g., "Solo Parent")
        $documentName = $documentType->name;

        // 2. Convert the name to a valid component name using StudlyCase (e.g., "SoloParent")
        $componentName = Str::studly($documentName);

        // 3. Construct the dynamic view path (e.g., "Residents/SoloParent")
        $viewPath = 'Residents/papers/' . $componentName;

        // 4. Render the specific component, passing the document type data to it
        return Inertia::render($viewPath, [
            'documentType' => $documentType,
        ]);
    }

    /**
     * Store a newly created document request in the database.
     */
  // In your DocumentRequestController.php (or similar)

public function store(Request $request)
{
    $validated = $request->validate([
        'document_type_id' => 'required|exists:document_types,id',
        'disability_type' => 'nullable|string|max:255',
        'other_disability' => 'nullable|string|max:255',
    ]);

    // --- THIS IS THE FIX ---
    // Get the DocumentType model to check its name
    $documentType = \App\Models\DocumentType::find($validated['document_type_id']);

    $formData = [
        'disability_type' => $validated['disability_type'] ?? null,
        'other_disability' => $validated['other_disability'] ?? null,
        
        // Set a default purpose specifically for PWD requests
        'purpose' => ($documentType && $documentType->name === 'pwd') 
                        ? 'For PWD ID Application' 
                        : null,
    ];

    DocumentRequest::create([
        'user_id' => auth()->id(),
        'document_type_id' => $validated['document_type_id'],
        'status' => 'pending',
        'form_data' => $formData,
    ]);

    return redirect()->route('residents.home')->with('success', 'Request submitted successfully!');
}

}