<?php

namespace App\Http\Controllers\Admin;

use App\Events\AdminMessageSent; // 👈 PALITAN ITO
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

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

        $newReply = $message->replies()->create([
            'user_id' => Auth::id(),
            'message' => $validated['reply_message'],
        ]);

        $message->update(['status' => 'replied']);

        $newReply->load('user');
        // 👇 GAMITIN ANG BAGONG EVENT
        broadcast(new AdminMessageSent($newReply))->toOthers();

        return redirect()->route('admin.messages');
    }
}