<?php

use App\Models\ContactMessage; // 👈 THE FIX: Add this line to import the model
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Add this authorization logic for the admin channel
Broadcast::channel('admin-requests', function ($user) {
    return $user && ($user->can('be-admin') || $user->can('be-super-admin'));
});

/**
 * Authorize that the user can listen to a specific conversation channel.
 * Only the original sender (resident) or an admin can listen.
 */
Broadcast::channel('conversation.{contactMessageId}', function ($user, $contactMessageId) {
    // Check if the user is an admin or super_admin. They can access any conversation.
    if (Gate::forUser($user)->allows('be-admin')) {
        return true;
    }

    // If not an admin, check if they are the original owner of the conversation thread.
    $contactMessage = ContactMessage::find($contactMessageId);

    // Ensure the message exists and the user is the owner.
    return $contactMessage && (int) $user->id === (int) $contactMessage->user_id;
});