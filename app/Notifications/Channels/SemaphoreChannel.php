<?php

namespace App\Notifications\Channels;

use App\Services\SmsService; // <-- Import your new service
use Illuminate\Notifications\Notification;

class SemaphoreChannel
{
    /**
     * Send the given notification.
     *
     * @param  object  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send(object $notifiable, Notification $notification): void
    {
        // Get the message content from the notification class
        $message = $notification->toSemaphore($notifiable);

        // Get the recipient's phone number from the User model
        $recipient = $notifiable->routeNotificationFor('semaphore', $notification);

        if (!$recipient) {
            return; // Don't send if there's no phone number
        }

        // Use your SmsService to send the message
        (new SmsService())->send($recipient, $message);
    }
}