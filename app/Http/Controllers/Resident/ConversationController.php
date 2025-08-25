<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ConversationController extends Controller
{
    /**
     * Fetch all conversation messages for the authenticated user.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        // Eager load conversations and their replies, along with the user who sent each reply
        $contactMessages = ContactMessage::where('user_id', $user->id)
            ->with(['replies.user'])
            ->latest()
            ->get();

        $formattedMessages = collect();

        foreach ($contactMessages as $contactMessage) {
            // Add the original message
            $formattedMessages->push([
                'id' => 'contact-'.$contactMessage->id,
                'text' => "Subject: {$contactMessage->subject}\n\n{$contactMessage->message}",
                'sender' => 'user', // The original message is always from the user
                'created_at' => $contactMessage->created_at->toIso8601String(),
            ]);

            // Add all replies for this message
            foreach ($contactMessage->replies as $reply) {
                $formattedMessages->push([
                    'id' => 'reply-'.$reply->id,
                    'text' => $reply->message,
                    // Determine if the sender is an admin or the resident
                    'sender' => $reply->user->role === 'resident' ? 'user' : 'admin',
                    'created_at' => $reply->created_at->toIso8601String(),
                ]);
            }
        }

        // Sort all messages chronologically and return as a flat array
        $sortedMessages = $formattedMessages->sortBy('created_at')->values();

        return response()->json($sortedMessages);
    }

    /**
     * Store a new message (reply) from the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $user = Auth::user();

        // Find the most recent conversation thread started by this user
        $latestContactMessage = ContactMessage::where('user_id', $user->id)->latest()->first();

        // If user has no prior conversation, create a new one.
        // This is a fallback, but typically they should have one from the Contact Us page.
        if (!$latestContactMessage) {
            $latestContactMessage = ContactMessage::create([
                'user_id' => $user->id,
                'subject' => 'General Inquiry (from chat)',
                'message' => $validated['message'],
                'status' => 'unread',
            ]);
            // Since this is the first message, we don't need to create a separate reply
            return response()->json(['status' => 'success', 'message' => 'New conversation started.'], 201);
        }

        // Create a new reply and attach it to the latest conversation thread
        Reply::create([
            'contact_message_id' => $latestContactMessage->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
        ]);
        
        // Also, update the status of the parent message to 'unread' so admin gets notified
        $latestContactMessage->update(['status' => 'unread']);

        return response()->json(['status' => 'success', 'message' => 'Reply sent.'], 201);
    }
}