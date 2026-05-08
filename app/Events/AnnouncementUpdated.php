<?php

namespace App\Events;

use App\Models\Announcement;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $announcement;
    public string $action;

    public function __construct(Announcement $announcement, string $action = 'created')
    {
        $this->announcement = $announcement->load('user.profile');
        $this->action = $action;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('announcements'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AnnouncementUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'announcement' => [
                'id' => $this->announcement->id,
                'tag' => $this->announcement->tag,
                'title' => $this->announcement->title,
                'description' => $this->announcement->description,
                'link' => $this->announcement->link,
                'image_url' => $this->announcement->image_url,
                'created_at' => $this->announcement->created_at,
                'user' => $this->announcement->user,
            ],
            'action' => $this->action,
        ];
    }
}
