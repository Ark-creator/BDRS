<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use App\Models\User;

class MessagesCounterController extends Controller
{
    public function getUnreadMessages()
    {
        $user = auth()->user();

        if (!$user || !$user->hasAnyRole(['admin', 'super_admin'])) {
            return response()->json(['messages' => [], 'count' => 0]);
        }

        // Bilangin ang bagong contact messages
        $unreadContactMessagesCount = ContactMessage::where('status', 'unread')->count();

        // Bilangin ang mga reply mula sa residente na hindi pa nababasa ng admin
        $unreadRepliesCount = Reply::where('status', 'unread')
            ->whereHas('user', function ($query) {
                $query->where('role', 'resident');
            })
            ->count();
        
        $totalUnread = $unreadContactMessagesCount + $unreadRepliesCount;

        // Kunin ang pinakabagong 5 unread na mensahe (pinagsamang contact at reply)
        $unreadItems = ContactMessage::where('status', 'unread')
                        ->with('user')
                        ->latest()
                        ->limit(5)
                        ->get();

        return response()->json([
            'messages' => $unreadItems, // Itong listahan ay para lang sa bubble preview
            'count' => $totalUnread,
        ]);
    }
}