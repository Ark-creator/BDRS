<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Inertia\Inertia;
use Illuminate\Http\Request; // <-- IDAGDAG ITO
use Illuminate\Http\RedirectResponse; // <-- IDAGDAG ITO
use App\Models\ImmutableDocumentsArchiveHistory; 

use Inertia\Response; // Import Response class

class RequestDocumentsController extends Controller
{
    public function index()
{
    $documentRequests = DocumentRequest::with(['user.profile', 'documentType'])
        ->latest()
        ->paginate(50); // <-- pinalitan ng paginate()

    return Inertia::render('Admin/Request', [
        'documentRequests' => $documentRequests,
    ]);
}
public function update(Request $request, DocumentRequest $documentRequest): RedirectResponse
{
    $validated = $request->validate([
        'status' => 'required|string|in:Pending,Processing,Rejected,Ready to Pickup,Claimed', 
        'admin_remarks' => 'nullable|string|max:500',
    ]);

    $documentRequest->status = $validated['status'];
    $documentRequest->admin_remarks = $validated['admin_remarks'] ?? $documentRequest->admin_remarks;
    $documentRequest->processed_by = auth()->id();
    
    // --- ITO ANG BAGONG LOGIC PARA SA ARCHIVING ---
    if ($validated['status'] === 'Claimed' || $validated['status'] === 'Rejected') {
        // 1. I-create ang archive record
        ImmutableDocumentsArchiveHistory::create([
            'user_id' => $documentRequest->user_id,
            'document_type_id' => $documentRequest->document_type_id,
            'form_data' => $documentRequest->form_data,
            'status' => $validated['status'],
            'admin_remarks' => $documentRequest->admin_remarks,
            'processed_by' => $documentRequest->processed_by,
            'original_created_at' => $documentRequest->created_at,
        ]);

        // 2. I-delete ang original request
        $documentRequest->delete();

        return back()->with('success', 'Request has been archived successfully.');
    }
    
    // Kung hindi pa for archiving, i-save lang ang changes
    $documentRequest->save();

    return back()->with('success', 'Request status updated successfully.');
}
}