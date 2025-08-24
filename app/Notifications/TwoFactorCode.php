<?php

// app/Notifications/TwoFactorCode.php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorCode extends Notification
{
    use Queueable;

    public function __construct()
    {
        //
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Your Two-Factor Authentication Code')
                    ->line('Your two-factor authentication code is: ' . $notifiable->two_factor_code)
                    ->line('This code is valid for 10 minutes. If you did not attempt to log in, you can ignore this email.');
    }
}
