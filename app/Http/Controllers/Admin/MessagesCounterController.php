<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use Illuminate\Http\JsonResponse;

class MessagesCounterController extends Controller
{
    // public function getUnreadMessages(): JsonResponse
    // {
    //     $user = auth()->user();

    //     // THE FIX: Replace hasAnyRole() with a simple array check
    //     if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
    //         return response()->json(['messages' => [], 'count' => 0]);
    //     }

    //     // 1. Get new, unread conversation threads
    //     $unreadThreads = ContactMessage::where('status', 'unread')->with('user')->get();

    //     // 2. Get new, unread replies from residents
    //     $unreadReplies = Reply::where('status', 'unread')
    //         ->whereHas('user', function ($query) {
    //             $query->where('role', 'resident');
    //         })
    //         ->with(['user', 'contactMessage:id,subject'])
    //         ->get();

    //     // 3. Calculate the total count for the badge
    //     $totalUnreadCount = $unreadThreads->count() + $unreadReplies->count();

    //     // 4. Format the threads for the bubble
    //     $formattedThreads = $unreadThreads->map(function ($message) {
    //         return [
    //             'id' => 'contact-' . $message->id,
    //             'subject' => $message->subject,
    //             'message' => $message->message,
    //             'created_at' => $message->created_at,
    //         ];
    //     });

    //     // 5. Format the replies for the bubble
    //     $formattedReplies = $unreadReplies->map(function ($reply) {
    //         return [
    //             'id' => 'reply-' . $reply->id,
    //             'subject' => 'New reply: ' . $reply->contactMessage->subject,
    //             'message' => $reply->message,
    //             'created_at' => $reply->created_at,
    //         ];
    //     });

    //     // 6. Merge, sort by date, and take the latest 5
    //     $allItems = $formattedThreads->merge($formattedReplies);
    //     $sortedItems = $allItems->sortByDesc('created_at')->take(5)->values();

    //     return response()->json([
    //         'messages' => $sortedItems,
    //         'count' => $totalUnreadCount,
    //     ]);
    // }
}