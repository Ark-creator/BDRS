<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentsListController extends Controller
{
    /**
     * Display a list of all document types.
     */
    public function index(): Response
    {
        $documentTypes = DocumentType::all();

        return Inertia::render('Admin/Documents', [
            'documentTypes' => $documentTypes,
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
            // The 'price' validation has been removed
        ]);

        $documentType->update($validated);

        return redirect()->route('admin.documents')->with('success', 'Document type updated successfully.');
    }

    /**
     * Remove the specified document type.
     */
    public function destroy(DocumentType $documentType): RedirectResponse
    {
        $documentType->delete();

        return redirect()->route('admin.documents')->with('success', 'Document type deleted successfully.');
    }
}