<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse; // Import JsonResponse
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
     * Toggles the archive status of a document type.
     */
    public function archive(DocumentType $documentType): RedirectResponse
    {
        // This line toggles the value between true (1) and false (0)
        $documentType->update(['is_archived' => !$documentType->is_archived]);
        
        $message = $documentType->is_archived ? 'Document type archived successfully.' : 'Document type restored successfully.';
        
        return back()->with('success', $message);
    }

    /**
     * Fetch archived documents as JSON for the modal.
     */
    public function getArchivedDocuments(): JsonResponse
    {
        $archivedDocuments = DocumentType::where('is_archived', true)->get();
        return response()->json([
            'archivedDocuments' => $archivedDocuments
        ]);
    }
}