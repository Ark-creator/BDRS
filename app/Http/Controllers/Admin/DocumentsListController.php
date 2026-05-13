<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DocumentsListController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Documents', [
            'documentTypes' => Cache::remember('admin.document_types.active', now()->addMinutes(10), function () {
                return DocumentType::where('is_archived', false)->get();
            }),
        ]);
    }

    public function update(Request $request, DocumentType $documentType): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
        ]);

        $documentType->update($validated);

        Cache::forget('admin.document_types.active');
        Cache::forget('resident.document_types');

        return redirect()->route('admin.documents')->with('success', 'Document type updated successfully.');
    }

    public function archive(DocumentType $documentType): RedirectResponse
    {
        $isCurrentlyArchived = $documentType->is_archived;
        $message = '';

        if ($isCurrentlyArchived) {
            $documentType->update([
                'is_archived' => false,
                'archived_by' => null,
            ]);
            $message = 'Document type restored successfully.';
        } else {
            $documentType->update([
                'is_archived' => true,
                'archived_by' => Auth::id(),
            ]);
            $message = 'Document type archived successfully.';
        }

        Cache::forget('admin.document_types.active');
        Cache::forget('admin.document_types.archived');
        Cache::forget('resident.document_types');

        return back()->with('success', $message);
    }

    public function getArchivedDocuments(): JsonResponse
    {
        $archivedDocuments = Cache::remember('admin.document_types.archived', now()->addMinutes(10), function () {
            return DocumentType::where('is_archived', true)
                ->with('archivedBy')
                ->get();
        });

        return response()->json([
            'archivedDocuments' => $archivedDocuments,
        ]);
    }
}
