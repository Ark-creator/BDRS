<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Reply;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class MessageCounterController extends Controller
{
    /**
     * Get the unread message count for the authenticated resident.
     */
    public function getUnreadCount(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user || $user->role !== 'resident') {
            return response()->json(['count' => 0]);
        }

        // Bilangin ang mga reply na galing sa admin at may status na 'unread'
        $unreadCount = Reply::whereHas('contactMessage', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('user_id', '!=', $user->id) // Galing sa admin
            ->where('status', 'unread')
            ->count();

        return response()->json(['count' => $unreadCount]);
    }
    
    /**
     * Get the list of unread messages for the resident's notification bubble.
     */
    public function getUnreadMessagesList(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user || $user->role !== 'resident') {
            return response()->json(['messages' => [], 'count' => 0]);
        }

        // Kunin ang listahan ng mga reply na galing sa admin at may status na 'unread'
        $unreadMessages = Reply::whereHas('contactMessage', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->where('user_id', '!=', $user->id)
            ->where('status', 'unread')
            ->with('contactMessage:id,subject')
            ->latest()
            ->limit(5)
            ->get();
            
        $formattedMessages = $unreadMessages->map(function ($reply) {
            return [
                'id' => $reply->id,
                'subject' => $reply->contactMessage->subject ?? 'Reply to your message',
                'message' => $reply->message,
            ];
        });

        return response()->json([
            'messages' => $formattedMessages,
            'count' => $formattedMessages->count(),
        ]);
    }
}