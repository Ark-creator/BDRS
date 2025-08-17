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
    public function index(): Response
    {
        // Eager load the user, user's profile, and document type
        $documentRequests = DocumentRequest::with(['user.profile', 'documentType'])->get();

        return Inertia::render('Admin/Request', [
            'documentRequests' => $documentRequests,
        ]);
    }
    public function update(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Processing,Rejected,Claimed,Ready To Pickup, Completed',
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