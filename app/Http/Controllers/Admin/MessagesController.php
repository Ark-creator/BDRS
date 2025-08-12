<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class MessagesController extends Controller
{
    public function index(Request $request): Response
    {
        $subjects = ['General Inquiry', 'Feedback', 'Support', 'Complaint'];
        
        // Eager load replies and user profile
        $query = ContactMessage::with(['user.profile', 'replies'])->latest();

        if ($request->has('subject') && in_array($request->subject, $subjects)) {
            $query->where('subject', $request->subject);
        }

        $messages = $query->get();

        return Inertia::render('Admin/Messages', [
            'messages' => $messages,
            'subjects' => $subjects,
            'currentSubject' => $request->subject,
        ]);
    }

    public function updateStatus(ContactMessage $message): RedirectResponse
    {
        $message->update(['status' => 'read']);
        return redirect()->route('admin.messages')->with('success', 'Message status updated to read.');
    }

    /**
     * Store a reply to a specific contact message.
     */
    public function storeReply(Request $request, ContactMessage $message): RedirectResponse
    {
        $validated = $request->validate([
            'reply_message' => 'required|string',
        ]);

        // Create the reply
        $message->replies()->create([
            'user_id' => Auth::id(), // The logged-in admin
            'message' => $validated['reply_message'],
        ]);

        // Optional: Update the original message status to 'replied'
        $message->update(['status' => 'replied']);

        return redirect()->route('admin.messages')->with('success', 'Reply sent successfully!');
    }
}