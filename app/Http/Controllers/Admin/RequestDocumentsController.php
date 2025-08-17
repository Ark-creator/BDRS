<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Inertia\Inertia;
use Illuminate\Http\Request; // <-- IDAGDAG ITO
use Illuminate\Http\RedirectResponse; // <-- IDAGDAG ITO

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
        // --- ITO ANG BINAGO ---
        'status' => 'required|string|in:Pending,Processing,Rejected,Claimed,Ready to Pickup,Completed', 
        'admin_remarks' => 'nullable|string|max:500', // For rejection reason
    ]);

    $documentRequest->update([
        'status' => $validated['status'],
        'admin_remarks' => $validated['admin_remarks'] ?? $documentRequest->admin_remarks,
        'processed_by' => auth()->id(), // Track who processed it
    ]);

    return back()->with('success', 'Request status updated successfully.');
}
}