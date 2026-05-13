<?php

namespace App\Http\Controllers\Resident\RequestPaper;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse; // Import RedirectResponse
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BrgyController extends Controller
{
    public function brgyClearance(): Response|RedirectResponse
    {
        $documentType = DocumentType::where('name', 'Barangay Clearance')->first();
        $user = Auth::user();

        if (!$user->is_verified) {
            return redirect()->route('residents.home')
                ->with('error', 'Your account must be verified to request documents. Please wait for an admin to approve your credentials.');
        }

        if (!$documentType || $documentType->is_archived || !$documentType->is_requestable) {
            return redirect()->route('residents.home')
                ->with('error', 'Barangay Clearance is not currently available for request.');
        }

        $userProfile = $user->profile;
        return Inertia::render('Residents/papers/BrgyClearance', [
            'userProfile' => $userProfile,
            'documentType' => $documentType,
        ]);
    }

    /**
     * Store a new Barangay Clearance request.
     */
    public function storeBrgyClearance(Request $request): RedirectResponse
    {
        $documentType = DocumentType::where('name', 'Barangay Clearance')->first();
        $user = Auth::user();

        if (!$user->is_verified) {
            return redirect()->route('residents.home')
                ->with('error', 'Your account must be verified to request documents.');
        }

        if (!$documentType || $documentType->is_archived || !$documentType->is_requestable) {
            return redirect()->route('residents.home')
                ->with('error', 'Barangay Clearance is not currently available for request.');
        }

        // 1. Validate the incoming data (only 'purpose' is editable)
        $validated = $request->validate([
            'purpose' => 'required|string|max:255',
        ]);

        // 2. Create the new request record in the database
        DocumentRequest::create([
            'user_id' => $user->id,
            'document_type_id' => $documentType->id,
            'barangay_id' => $documentType->barangay_id ?: $user->barangay_id,
            'form_data' => $validated,
            'status' => 'Pending',
        ]);

        // 3. Redirect back to a page with a success message
        return redirect()->route('residents.home')->with('success', 'Your request has been submitted successfully!');
    }
}
