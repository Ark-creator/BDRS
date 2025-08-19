<?php

namespace App\Http\Controllers\Admin;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Models\DocumentRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use App\Models\ImmutableDocumentsArchiveHistory;
use Illuminate\Validation\Rule; // <-- 1. IDAGDAG ITO
use Symfony\Component\HttpFoundation\StreamedResponse;

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

  public function setPaymentAmount(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        // 1. We only want this to work for Business Permits
        if ($documentRequest->documentType->name !== 'Brgy Business Permit') {
            return back()->with('error', 'This action is not applicable for this document type.');
        }

        // 2. Validate the incoming amount
        $validated = $request->validate([
            'payment_amount' => 'required|numeric|min:0|max:999999.99',
        ]);

        // 3. Update the request with the amount and new status
        $documentRequest->update([
            'payment_amount' => $validated['payment_amount'],
            'status' => 'For Payment', // This is our new, custom status
        ]);

        // 4. (Optional) You could trigger an email or SMS notification to the user here.

        return back()->with('success', 'Payment amount has been set. The user will be notified to proceed with payment.');
    }


    public function update(Request $request, DocumentRequest $documentRequest): RedirectResponse
    {
        $validated = $request->validate([
            // --- UPDATE THIS LINE ---
            // Add 'For Payment' to the list of valid statuses
            'status' => 'required|string|in:Assess For Payment,Processing,For Payment,Rejected,Ready to Pickup,Claimed',
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

     public function showReceipt(DocumentRequest $documentRequest): StreamedResponse
    {
        // 1. Check for the file path
        if (!$documentRequest->payment_receipt_path) {
            abort(404, 'Receipt path not found.');
        }

        // 2. Check if the file exists on the 'local' disk
        if (!Storage::disk('local')->exists($documentRequest->payment_receipt_path)) {
            abort(404, 'Receipt file not found.');
        }

        // 3. Securely stream the file as a response
        return Storage::disk('local')->response($documentRequest->payment_receipt_path);
    }

}
