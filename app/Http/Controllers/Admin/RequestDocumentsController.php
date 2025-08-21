<?php

namespace App\Http\Controllers\Admin;

use App\Events\DocumentRequestStatusUpdated;
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

        DocumentRequestStatusUpdated::dispatch($documentRequest);

        return back()->with('success', 'Payment amount has been set. The user will be notified.');
    }

    public function update(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        // First, validate the status to ensure it's a valid option.
        $request->validate([
            'status' => ['required', 'string', Rule::in(['Processing', 'Ready to Pickup', 'Claimed', 'Rejected'])],
        ]);

        $status = $request->input('status');
        $remarks = $request->input('admin_remarks');

        // Handle the archiving case (Rejected or Claimed)
        if ($status === 'Claimed' || $status === 'Rejected') {
            // If the status is 'Rejected', validate that remarks are provided.
            if ($status === 'Rejected') {
                $request->validate([
                    'admin_remarks' => 'required|string|max:500'
                ]);
            }

            ImmutableDocumentsArchiveHistory::create([
                'original_request_id' => $documentRequest->id,
                'user_id' => $documentRequest->user_id,
                'document_type_id' => $documentRequest->document_type_id,
                'form_data' => $documentRequest->form_data,
                'status' => $status,
                'admin_remarks' => $remarks,
                'processed_by' => auth()->id(),
                'original_created_at' => $documentRequest->created_at,
            ]);

            $documentRequest->delete();

            return back()->with('success', 'Request has been archived successfully.');
        }

        // Handle all other status updates
        $documentRequest->status = $status;
        $documentRequest->admin_remarks = $remarks; // Can be null for other statuses
        $documentRequest->processed_by = auth()->id();
        $documentRequest->save();
        
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
