<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Inertia\Inertia;
use Illuminate\Http\Request; // Make sure this is imported
use Illuminate\Http\RedirectResponse;
use App\Models\ImmutableDocumentsArchiveHistory;
use Inertia\Response;

class RequestDocumentsController extends Controller
{
    public function index(Request $request): Response // Add Request $request and Response type hint
    {
        // 1. Get the filter values from the URL query string
        $filters = $request->only('search', 'status');

        $documentRequests = DocumentRequest::query()
            ->whereNotIn('status', ['Claimed', 'Rejected'])
            
            // 2. Apply filters to the database query
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user.profile', function ($subQuery) use ($search) {
                        $subQuery->where('first_name', 'like', "%{$search}%")
                                 ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('documentType', function ($subQuery) use ($search) {
                        $subQuery->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->when(($filters['status'] ?? 'All') !== 'All', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            
            ->with(['user.profile', 'documentType'])
            ->latest()
            ->paginate(10)
            ->withQueryString(); // 3. Append filter query strings to pagination links

        return Inertia::render('Admin/Request', [
            'documentRequests' => $documentRequests,
            'filters' => $filters, // 4. Pass the filters back to the view
        ]);
    }

    // ... your update() method remains the same ...
    public function update(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Processing,Rejected,Ready to Pickup,Claimed', 
            'admin_remarks' => 'nullable|string|max:500',
        ]);
    
        $documentRequest->status = $validated['status'];
        $documentRequest->admin_remarks = $validated['admin_remarks'] ?? $documentRequest->admin_remarks;
        $documentRequest->processed_by = auth()->id();
        
        if ($validated['status'] === 'Claimed' || $validated['status'] === 'Rejected') {
            ImmutableDocumentsArchiveHistory::create([
                'user_id' => $documentRequest->user_id,
                'document_type_id' => $documentRequest->document_type_id,
                'form_data' => $documentRequest->form_data,
                'status' => $validated['status'],
                'admin_remarks' => $documentRequest->admin_remarks,
                'processed_by' => $documentRequest->processed_by,
                'original_created_at' => $documentRequest->created_at,
            ]);
    
            $documentRequest->delete();
    
            return back()->with('success', 'Request has been archived successfully.');
        }
        
        $documentRequest->save();
    
        return back()->with('success', 'Request status updated successfully.');
    }
}