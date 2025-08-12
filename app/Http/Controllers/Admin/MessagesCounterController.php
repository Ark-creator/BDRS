<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ContactMessage;

class MessagesCounterController extends Controller
{
    /**
     * Gets the unread messages for the admin.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUnreadMessages()
    {
        $user = auth()->user();

        if ($user && ($user->role === 'admin' || $user->role === 'super_admin')) {
            // Kunin ang lahat ng unread messages, limitahan sa 5 para hindi masyadong mahaba.
            $unreadMessages = ContactMessage::where('status', 'unread')
                                          ->with('user') // Isama ang user details
                                          ->latest()
                                          ->limit(5)
                                          ->get();

            // Ibalik ang listahan ng messages at ang total count
            return response()->json([
                'messages' => $unreadMessages,
                'count' => $unreadMessages->count(),
            ]);
        }

        return response()->json(['messages' => [], 'count' => 0]);
    }
}