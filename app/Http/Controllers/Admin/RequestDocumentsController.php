<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Models\ImmutableDocumentsArchiveHistory;
use Inertia\Response;
use Illuminate\Validation\Rule; // <-- 1. IDAGDAG ITO

class RequestDocumentsController extends Controller
{
    // ... ang iyong index() method ay tama na ...
    public function index(Request $request): Response
    {
        // ... code from previous step ...
        $filters = $request->only('search', 'status');
        $documentRequests = DocumentRequest::query()
            ->whereNotIn('status', ['Claimed', 'Rejected'])
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
            ->withQueryString();
        return Inertia::render('Admin/Request', [
            'documentRequests' => $documentRequests,
            'filters' => $filters,
        ]);
    }

    public function update(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        // --- 2. ITO ANG BINAGO ---
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Processing,Rejected,Ready to Pickup,Claimed', 
            // Gawing required ang remarks KUNG ang status ay 'Rejected'
            'admin_remarks' => [
                Rule::requiredIf($request->status === 'Rejected'),
                'nullable',
                'string',
                'max:500'
            ],
        ]);
    
        $documentRequest->status = $validated['status'];
        // Gagamitin na natin ang validated remarks dahil sigurado nang may laman ito kung rejected
        $documentRequest->admin_remarks = $validated['admin_remarks'] ?? null;
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