<?php

namespace App\Http\Controllers\Resident;

use Inertia\Inertia;
use Illuminate\Support\Str;
use App\Models\DocumentType;
use Illuminate\Http\Request;
use App\Models\DocumentRequest;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Events\DocumentRequestCreated;
use App\Models\ImmutableDocumentsArchiveHistory;

class DocumentRequestController extends Controller
{
    /**
     * Display a listing of the user's active and past document requests.
     */
    public function index(Request $request)
    {
        $userId = Auth::id();

        // Fetch active requests (not yet Claimed or Rejected)
        $activeRequests = DocumentRequest::query()
            ->where('user_id', $userId)
            ->with(['documentType', 'user'])
            ->latest()
            ->paginate(5, ['*'], 'active_page') // Paginate active requests
            ->withQueryString();

        // Fetch past requests (Claimed or Rejected) from the archive table
        $pastRequests = ImmutableDocumentsArchiveHistory::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['Claimed', 'Rejected'])
            ->with(['documentType', 'processor.profile'])
            ->latest('original_created_at')
            ->paginate(5, ['*'], 'past_page') // Paginate past requests separately
            ->withQueryString();

        return Inertia::render('Residents/MyRequests', [
            'activeRequests' => $activeRequests,
            'pastRequests' => $pastRequests,
        ]);
    }

    /**
     * Show the form to create a new document request.
     */
    public function create(DocumentType $documentType)
    {
        $componentName = Str::studly($documentType->name);
        $viewPath = 'Residents/papers/' . $componentName;

        $userProfile = Auth::user()->profile;

        return Inertia::render($viewPath, [
            'documentType' => $documentType,
            'userProfile'  => $userProfile,
        ]);
    }

    /**
     * Store a newly created document request in the database.
     */
    public function store(Request $request)
    {
        // 1. Validate common fields required for logic
        $commonValidated = $request->validate([
            'document_type_id' => 'required|exists:document_types,id',
            'signature_data' => 'nullable|string',
        ]);

        $documentType = DocumentType::find($commonValidated['document_type_id']);
        $formData = []; // Initialize empty array for specific form data

        // 2. Use a switch statement to handle logic for each document type
        switch ($documentType->name) {
            case 'Brgy Business Permit':
                $specificData = $request->validate([
                    'business_name' => 'required|string|max:255',
                    'business_type' => 'required|string|max:255',
                    'business_address' => 'required|string',
                ]);
                $formData = $specificData;
                break;

            case 'pwd':
                $specificData = $request->validate([
                    'disability_type' => 'required|string|max:255',
                    'other_disability' => 'nullable|string|max:255',
                ]);
                $formData = $specificData;
                break;

            case 'Certificate of Indigency':
            case 'Solo Parent':
            case 'Barangay Clearance':
                $specificData = $request->validate([
                    'purpose' => 'required|string|max:255',
                    'other_purpose' => 'nullable|string|max:255',
                ]);
                if ($specificData['purpose'] === 'Others') {
                    $formData['purpose'] = $specificData['other_purpose'] ?? 'Not specified';
                } else {
                    $formData['purpose'] = $specificData['purpose'];
                }
                break;

            default:
                // Default case for any other documents
                break;
        }

        // 3. Handle Signature
        if (!empty($commonValidated['signature_data'])) {
            $image = str_replace('data:image/png;base64,', '', $commonValidated['signature_data']);
            $image = str_replace(' ', '+', $image);
            $imageData = base64_decode($image);

            $fileName = 'signature_' . auth()->id() . '_' . uniqid() . '.png';
            $signaturePath = 'signatures/' . $fileName;

            Storage::disk('local')->put($signaturePath, $imageData);
            $formData['signature_path'] = $signaturePath;

            if ($userProfile = auth()->user()->profile) {
                $userProfile->signature_data = $signaturePath;
                $userProfile->save();
            }
        }

        // 4. Create the document request record
        $newRequest = DocumentRequest::create([
            'user_id'          => auth()->id(),
            'document_type_id' => $commonValidated['document_type_id'],
            'status'           => 'Pending',
            'form_data'        => $formData,
        ]);

        // 5. Dispatch the event
        DocumentRequestCreated::dispatch($newRequest);

        return redirect()
            ->route('residents.requests.index') // Redirect to the "My Requests" page
            ->with('success', 'Request for ' . $documentType->name . ' submitted successfully!');
    }

    public function submitPayment(Request $request, DocumentRequest $documentRequest)
    {
        if ($documentRequest->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        if ($documentRequest->status !== 'Waiting for Payment') {
            return back()->with('error', 'This request is not currently awaiting payment.');
        }

        $validated = $request->validate([
            'receipt' => 'required|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $path = $validated['receipt']->store('receipts', 'local');

        $documentRequest->update([
            'payment_receipt_path' => $path,
            'payment_status' => 'paid',
            'paid_at' => now(),
            'status' => 'Processing',
        ]);

        return redirect()->route('residents.requests.index')
            ->with('success', 'Payment submitted successfully! Your request is now being processed.');
    }
}
