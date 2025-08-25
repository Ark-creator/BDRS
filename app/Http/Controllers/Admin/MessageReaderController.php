<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use Illuminate\Http\RedirectResponse; // 👈 Change this import
use Illuminate\Support\Facades\Auth;

class MessageReaderController extends Controller
{
    /**
     * Mark a conversation thread as read by the admin.
     */
    // public function markAsRead(ContactMessage $contactMessage): RedirectResponse // 👈 Change return type here
    // {
    //     $user = Auth::user();

    //     if (!$user || !in_array($user->role, ['admin', 'super_admin'])) {
    //         // In a real Inertia response, we'd redirect with an error.
    //         // For now, just redirect back.
    //         return back();
    //     }

    //     if ($contactMessage->status === 'unread') {
    //         $contactMessage->update(['status' => 'read']);
    //     }

    //     Reply::where('contact_message_id', $contactMessage->id)
    //          ->where('user_id', '!=', $user->id) 
    //          ->where('status', 'unread')
    //          ->update(['status' => 'read']);

    //     // 👇 THE FIX: Return a redirect instead of JSON
    //     return redirect()->route('admin.messages');
    // }
}