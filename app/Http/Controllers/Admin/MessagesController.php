<?php

namespace App\Http\Controllers\Admin;

use App\Events\AdminMessageSent;
use App\Events\UnreadMessageCountUpdated;
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use App\Services\AdminUnreadMessageNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MessagesController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Messages', [
            'messages' => ContactMessage::select(['id', 'user_id', 'subject', 'message', 'status', 'created_at'])
                ->with(['user.profile:user_id,first_name,middle_name,last_name', 'replies.user.profile:user_id,first_name,middle_name,last_name'])
                ->latest()
                ->get(),
        ]);
    }

    public function storeReply(Request $request, ContactMessage $message): JsonResponse
    {
        $validated = $request->validate([
            'reply_message' => 'required|string',
        ]);

        $newReply = $message->replies()->create([
            'user_id' => Auth::id(),
            'message' => $validated['reply_message'],
        ]);

        $message->update(['status' => 'replied']);

        $newReply->load('user');
        broadcast(new AdminMessageSent($newReply));

        if ($message->user_id) {
            $unreadReplies = Reply::select(['id', 'contact_message_id', 'user_id', 'message', 'status'])
                ->whereHas('contactMessage', fn ($query) => $query->where('user_id', $message->user_id))
                ->where('user_id', '!=', $message->user_id)
                ->where('status', 'unread')
                ->with('contactMessage:id,subject')
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($reply) => [
                    'id' => $reply->id,
                    'subject' => $reply->contactMessage->subject ?? 'Reply to your message',
                    'message' => $reply->message,
                ]);

            broadcast(new UnreadMessageCountUpdated($message->user_id, $unreadReplies->count(), $unreadReplies->toArray()));
        }

        return response()->json(['status' => 'success']);
    }

    public function getUnreadMessages(): JsonResponse
    {
        $user = auth()->user();
        if (! $user || ! in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['messages' => [], 'count' => 0]);
        }

        return response()->json(
            app(AdminUnreadMessageNotifier::class)->payloadForBarangay($user->barangay_id)
        );
    }

    public function markAsRead(ContactMessage $contactMessage): RedirectResponse
    {
        $user = Auth::user();

        if (! $user || ! in_array($user->role, ['admin', 'super_admin'])) {
            return back();
        }

        if ($contactMessage->status === 'unread') {
            $contactMessage->update(['status' => 'read']);
        }

        Reply::where('contact_message_id', $contactMessage->id)
            ->where('user_id', '!=', $user->id)
            ->where('status', 'unread')
            ->update(['status' => 'read']);

        $this->broadcastUnreadCountToAdmins();

        return redirect()->route('admin.messages');
    }

    private function broadcastUnreadCountToAdmins(): void
    {
        app(AdminUnreadMessageNotifier::class)
            ->broadcastToBarangayAdmins(Auth::user()->barangay_id);
    }
}
