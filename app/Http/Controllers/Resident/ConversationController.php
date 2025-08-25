<?php

namespace App\Http\Controllers\Resident;

use App\Events\MessageSent; // Import the event
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ConversationController extends Controller
{
    /**
     * Fetch all conversation messages for the user and mark new messages as read.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        // 1. Find all conversation threads started by the user.
        $contactMessageIds = ContactMessage::where('user_id', $user->id)->pluck('id');
        
        // 2. Mark replies from the admin as 'read'.
        if ($contactMessageIds->isNotEmpty()) {
            Reply::whereIn('contact_message_id', $contactMessageIds)
                 ->where('user_id', '!=', $user->id) // Replies NOT from the user (i.e., admin)
                 ->where('status', 'unread')
                 ->update(['status' => 'read']);
        }

        // 3. Get all conversation threads with all replies and user details.
        $contactMessages = ContactMessage::where('user_id', $user->id)
            ->with(['replies.user'])
            ->latest()
            ->get();

        // 4. Format all messages into a single flat array.
        $formattedMessages = collect();
        foreach ($contactMessages as $contactMessage) {
            $formattedMessages->push([
                'id' => 'contact-'.$contactMessage->id,
                'text' => "Subject: {$contactMessage->subject}\n\n{$contactMessage->message}",
                'sender' => 'user',
                'created_at' => $contactMessage->created_at->toIso8601String(),
            ]);

            foreach ($contactMessage->replies as $reply) {
                $formattedMessages->push([
                    'id' => 'reply-'.$reply->id,
                    'text' => $reply->message,
                    'sender' => $reply->user->role === 'resident' ? 'user' : 'admin',
                    'created_at' => $reply->created_at->toIso8601String(),
                ]);
            }
        }

        // 5. Sort all messages by date.
        $sortedMessages = $formattedMessages->sortBy('created_at')->values();

        return response()->json($sortedMessages);
    }

    /**
     * Store a new reply from the user. (This was the missing part)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $user = Auth::user();

        // Find the most recent conversation thread started by the user.
        $latestContactMessage = ContactMessage::where('user_id', $user->id)->latest()->first();

        if (!$latestContactMessage) {
            return response()->json(['error' => 'No conversation thread found. Please send a message from the Contact Us page first.'], 404);
        }

        // Create the new reply record.
        $newReply = Reply::create([
            'contact_message_id' => $latestContactMessage->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
        ]);
        
        // Update the PARENT message thread status to notify the admin.
        $latestContactMessage->update(['status' => 'unread']);

        // Broadcast the event for real-time functionality.
        $newReply->load('user'); 
        broadcast(new MessageSent($newReply))->toOthers();

        return response()->json(['status' => 'success', 'message' => 'Reply sent successfully.'], 201);
    }
}