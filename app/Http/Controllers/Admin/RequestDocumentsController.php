<?php

namespace App\Http\Controllers\Admin;

use App\Events\DocumentRequestStatusUpdated; // <-- 1. IMPORT THE NEW EVENT
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Models\DocumentRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use App\Models\ImmutableDocumentsArchiveHistory;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RequestDocumentsController extends Controller
{
    public function index(Request $request): Response
    {
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

    public function setPaymentAmount(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        if ($documentRequest->documentType->name !== 'Brgy Business Permit') {
            return back()->with('error', 'This action is not applicable for this document type.');
        }

        $validated = $request->validate([
            'payment_amount' => 'required|numeric|min:0|max:999999.99',
        ]);

        $documentRequest->update([
            'payment_amount' => $validated['payment_amount'],
            'status' => 'Waiting for Payment',
        ]);

        // 2. DISPATCH THE EVENT AFTER UPDATING
        DocumentRequestStatusUpdated::dispatch($documentRequest);

        return back()->with('success', 'Payment amount has been set. The user will be notified.');
    }

    public function update(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Place an Amount to Pay,Processing, Waiting for Payment, Rejected,Ready to Pickup,Claimed',
            'admin_remarks' => [
                Rule::requiredIf($request->status === 'Rejected'),
                'nullable',
                'string',
                'max:500'
            ],
        ]);

        $documentRequest->status = $validated['status'];
        $documentRequest->admin_remarks = $validated['admin_remarks'] ?? null;
        $documentRequest->processed_by = auth()->id();

        if ($validated['status'] === 'Claimed' || $validated['status'] === 'Rejected') {
            // Logic for archiving...
            // We don't dispatch an event here because the item is removed from the list.
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

        // 3. DISPATCH THE EVENT AFTER SAVING
        DocumentRequestStatusUpdated::dispatch($documentRequest);

        return back()->with('success', 'Request status updated successfully.');
    }

    public function showReceipt(DocumentRequest $documentRequest): StreamedResponse
    {
        if (!$documentRequest->payment_receipt_path || !Storage::disk('local')->exists($documentRequest->payment_receipt_path)) {
            abort(404, 'Receipt file not found.');
        }
        return Storage::disk('local')->response($documentRequest->payment_receipt_path);
    }
}