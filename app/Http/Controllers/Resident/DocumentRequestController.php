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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'purpose' => 'required|string|max:255',
            'document_type_id' => 'required|exists:document_types,id',
        ]);

        DocumentRequest::create([
            'user_id' => Auth::id(),
            'document_type_id' => $validated['document_type_id'],
            'form_data' => ['purpose' => $validated['purpose']],
            'status' => 'pending',
        ]);

        return redirect()->route('residents.home')->with('success', 'Your request has been submitted successfully!');
    }
}