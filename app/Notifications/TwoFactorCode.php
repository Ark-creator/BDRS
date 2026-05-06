<?php
// app/Notifications/TwoFactorCode.php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Notifications\Channels\SemaphoreChannel; // Import our channel
use Illuminate\Notifications\Messages\MailMessage;

class TwoFactorCode extends Notification
{
    use Queueable;

    public function __construct() {}

    /**
     * Get the notification's delivery channels.
     * This method dynamically chooses the channel based on user preference.
     */
    public function via(object $notifiable): array
    {
        if ($notifiable->two_factor_method === 'sms') {
            return ['semaphore']; // Use our custom SMS channel
        }

        return ['mail']; // Default to email
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Your '.config('app.name').' security code')
                    ->markdown('mail.two_factor_code', [
                        'user' => $notifiable,
                        'code' => $notifiable->two_factor_code,
                        'expiresAt' => $notifiable->two_factor_expires_at,
                    ]);
    }

    /**
     * Get the SMS representation of the notification.
     */
    public function toSemaphore(object $notifiable): string
    {
        // The message content for the SMS
        return sprintf('%s security code: %s', config('app.name'), $notifiable->two_factor_code);
    }
}
