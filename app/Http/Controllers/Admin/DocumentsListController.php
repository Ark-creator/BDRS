<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DocumentsListController extends Controller
{
    /**
     * Display a list of all active document types.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Documents', [
            'documentTypes' => DocumentType::where('is_archived', false)->get(),
        ]);
    }

    /**
     * Update the specified document type.
     */
    public function update(Request $request, DocumentType $documentType): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
        ]);
        
        $documentType->update($validated);
        
        return redirect()->route('admin.documents')->with('success', 'Document type updated successfully.');
    }

    /**
     * Toggles the archive status of a document type and records the user.
     */
    public function archive(DocumentType $documentType): RedirectResponse
    {
        $isCurrentlyArchived = $documentType->is_archived;
        $message = '';

        if ($isCurrentlyArchived) {
            // ACTION: Restore the document
            $documentType->update([
                'is_archived' => false,
                'archived_by' => null // Clear the user ID on restore
            ]);
            $message = 'Document type restored successfully.';
        } else {
            // ACTION: Archive the document
            $documentType->update([
                'is_archived' => true,
                'archived_by' => Auth::id() // Set the current user's ID
            ]);
            $message = 'Document type archived successfully.';
        }
        
        return back()->with('success', $message);
    }

    /**
     * Fetch archived documents as JSON for the modal.
     */
    public function getArchivedDocuments(): JsonResponse
    {
        // Load the entire 'archivedBy' relationship.
        // Laravel will automatically append 'full_name' from your User model.
        $archivedDocuments = DocumentType::where('is_archived', true)
                                           ->with('archivedBy')
                                           ->get();
                                           
        return response()->json([
            'archivedDocuments' => $archivedDocuments
        ]);
    }
}