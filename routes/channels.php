<?php
// routes/channels.php

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
    // Replace this with your actual check for an admin user
    return $user && ($user->can('be-admin') || $user->can('be-super-admin'));
});