<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Display a listing of the payment transactions.
     */
    public function __invoke(Request $request): Response
    {
        // Filters now only include 'search'
        $filters = $request->only('search');

        // Start building the query on DocumentRequest model
        $paymentsQuery = DocumentRequest::query()
            // IMPORTANT: The query is now hardcoded to only fetch 'Paid' transactions
            ->where('payment_status', 'Paid')
            // Filter for Business Permits only
            ->whereHas('documentType', fn ($query) => $query->where('name', 'Brgy Business Permit'))
            // Eager load related data to avoid N+1 query issues
            ->with(['user.profile', 'documentType', 'processor.profile']);

        // Apply search filter for requestor's name
        $paymentsQuery->when($filters['search'] ?? null, function ($query, $search) {
            $query->whereHas('user.profile', function ($subQuery) use ($search) {
                $subQuery->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
            });
        });

        // Paginate the results
        $paginatedPayments = $paymentsQuery->latest('updated_at')->paginate(10)->withQueryString();

        // Transform the data collection to match the frontend's expected props
        $transformedPayments = $paginatedPayments->through(fn ($docRequest) => [
            'id' => $docRequest->id,
            'requestor_name' => $docRequest->user->profile->full_name,
            'document_name' => $docRequest->documentType->name,
            'amount' => $docRequest->payment_amount,
            'status' => $docRequest->payment_status,
            'date' => $docRequest->paid_at ? $docRequest->paid_at->toFormattedDateString() : $docRequest->updated_at->toFormattedDateString(),
            'processed_by' => $docRequest->processor ? $docRequest->processor->profile->full_name : 'N/A',
            'payment_receipt_url' => $docRequest->payment_receipt_url,
        ]);

        // Render the Inertia component with the fetched data
        return Inertia::render('Admin/Payment', [
            'payments' => $transformedPayments,
            'filters' => $filters,
        ]);
    }
}