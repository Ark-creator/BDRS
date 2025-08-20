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

class DocumentRequestController extends Controller
{
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

            case 'PWD Certificate':
                $specificData = $request->validate([
                    'disability_type' => 'required|string|max:255',
                    'other_disability' => 'nullable|string|max:255',
                ]);
                // Handle "Others" for disability type if needed
                $formData = $specificData;
                break;

            // Add cases for other simple documents that only have a purpose
            case 'Certificate of Indigency':
            case 'Solo Parent Certificate':
            case 'Barangay Clearance':
                $specificData = $request->validate([
                    'purpose' => 'required|string|max:255',
                    'other_purpose' => 'nullable|string|max:255',
                ]);
                // Handle "Others" for purpose
                if ($specificData['purpose'] === 'Others') {
                    $formData['purpose'] = $specificData['other_purpose'] ?? 'Not specified';
                } else {
                    $formData['purpose'] = $specificData['purpose'];
                }
                break;

            default:
                // Default case for any other documents with no specific fields
                // You can add validation for a 'purpose' field here if it's common
                break;
        }

        // 3. Handle Signature (This logic is now common for all requests)
        if (!empty($commonValidated['signature_data'])) {
            $image = str_replace('data:image/png;base64,', '', $commonValidated['signature_data']);
            $image = str_replace(' ', '+', $image);
            $imageData = base64_decode($image);

            $fileName = 'signature_' . auth()->id() . '_' . uniqid() . '.png';
            $signaturePath = 'signatures/' . $fileName;

            Storage::disk('local')->put($signaturePath, $imageData);

            // Add the signature path to the form data
            $formData['signature_path'] = $signaturePath;

            // Update the master signature on the user's profile
            if ($userProfile = auth()->user()->profile) {
                $userProfile->signature_data = $signaturePath;
                $userProfile->save();
            }
        }

        // 4. Create the document request record
        DocumentRequest::create([
            'user_id'          => auth()->id(),
            'document_type_id' => $commonValidated['document_type_id'],
            'status'           => 'Pending',
            'form_data'        => $formData, // $formData is now dynamically built
        ]);

        return redirect()
            ->route('residents.home') // Consider redirecting to a "my requests" page
         
            ->with('success', 'Request for ' . $documentType->name . ' submitted successfully!');
    }

    public function index()
{
    $requests = DocumentRequest::where('user_id', Auth::id())
        ->with('documentType') // Eager load the document name
        ->latest() // Show the newest requests first
        ->paginate(10);

    return Inertia::render('Residents/MyRequests', [
        'requests' => $requests,
    ]);
}

  public function submitPayment(Request $request, DocumentRequest $documentRequest)
    {
        // Authorization Check 1: Ensure the user owns this request.
        if ($documentRequest->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        // Authorization Check 2: Ensure the request is actually awaiting payment.
        if ($documentRequest->status !== 'Waiting for Payment') {
            return back()->with('error', 'This request is not currently awaiting payment.');
        }

        $validated = $request->validate([
            'receipt' => 'required|image|mimes:jpg,jpeg,png|max:2048', // 2MB Max size
        ]);

        // Store the uploaded receipt file in 'storage/app/public/receipts'
// Store the uploaded receipt file in 'storage/app/receipts' (which is private)
$path = $validated['receipt']->store('receipts', 'local');
        // Update the document request record in the database
        $documentRequest->update([
            'payment_receipt_path' => $path,
            'payment_status' => 'paid', // Mark as paid
            'paid_at' => now(),
            'status' => 'Processing', // Move the request to the next stage for the admin
        ]);

        return redirect()->route('residents.requests.index')
               ->with('success', 'Payment submitted successfully! Your request is now being processed.');
    }

}