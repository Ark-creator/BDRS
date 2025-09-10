<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ContactUsController extends Controller
{
    /**
     * Store a newly created contact message in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        // Validate the incoming request data
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255', 'in:General Inquiry,Feedback,Support,Complaint'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        // Create a new ContactMessage record
        ContactMessage::create([
            'user_id' => Auth::id(), // Get the ID of the currently authenticated user
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'barangay_id' => Auth::user()->barangay_id,
            'status' => 'unread', // Default status for new messages
        ]);

        // Redirect back to the contact page with a success message
        return redirect()->route('residents.contact')->with('success', 'Your message has been sent successfully!');
    }
}