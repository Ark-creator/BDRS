<?php

namespace App\Http\Controllers\Resident\RequestPaper;

use App\Http\Controllers\Controller;
// use App\Models\Request as DocumentRequest; // Rename 'Request' model to avoid conflict
use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BrgyController extends Controller
{
    public function brgyClearance(): Response
    {
        $userProfile = Auth::user()->profile;
        return Inertia::render('Residents/papers/BrgyClearance', [
            'userProfile' => $userProfile
        ]);
    }

    /**
     * Store a new Barangay Clearance request.
     */
    public function storeBrgyClearance(Request $request): \Illuminate\Http\RedirectResponse
    {
        // 1. Validate the incoming data (only 'purpose' is editable)
        $validated = $request->validate([
            'purpose' => 'required|string|max:255',
        ]);

        // 2. Create the new request record in the database
        DocumentRequest::create([
            'user_id' => Auth::id(),
            'document_type_id' => 1, // Assuming '1' is the ID for Barangay Clearance
            'form_data' => json_encode($validated), // Store validated data as JSON
            'status' => 'pending', // Default status
        ]);

        // 3. Redirect back to a page with a success message
        return redirect()->route('residents.home')->with('success', 'Your request has been submitted successfully!');
    }
}
