<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Reply;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class ConversationController extends Controller
{
    /**
     * Kunin ang lahat ng mensahe para sa user at markahan ang mga bagong mensahe bilang nabasa na.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        // 1. Hanapin ang lahat ng conversation threads na sinimulan ng user.
        $contactMessageIds = ContactMessage::where('user_id', $user->id)->pluck('id');
        
        // 2. Markahan ang mga reply mula sa admin bilang 'read'.
        // Ginagawa ito para hindi na lumabas sa notification counter ng user pagkatapos nilang buksan ang chat.
        if ($contactMessageIds->isNotEmpty()) {
            Reply::whereIn('contact_message_id', $contactMessageIds)
                 ->where('user_id', '!=', $user->id) // Mga reply na HINDI galing sa user (i.e., admin)
                 ->where('status', 'unread')
                 ->update(['status' => 'read']);
        }

        // 3. Kunin ang lahat ng conversation threads kasama ang lahat ng replies at user details.
        $contactMessages = ContactMessage::where('user_id', $user->id)
            ->with(['replies.user']) // Eager-load para mas mabilis
            ->latest() // Pinakabago muna
            ->get();

        // 4. I-format ang lahat ng mensahe (initial at replies) sa iisang flat array.
        $formattedMessages = collect();
        foreach ($contactMessages as $contactMessage) {
            // Idagdag ang unang mensahe ng thread
            $formattedMessages->push([
                'id' => 'contact-'.$contactMessage->id,
                'text' => "Subject: {$contactMessage->subject}\n\n{$contactMessage->message}",
                'sender' => 'user',
                'created_at' => $contactMessage->created_at->toIso8601String(),
            ]);

            // Idagdag ang lahat ng replies sa thread na ito
            foreach ($contactMessage->replies as $reply) {
                $formattedMessages->push([
                    'id' => 'reply-'.$reply->id,
                    'text' => $reply->message,
                    'sender' => $reply->user->role === 'resident' ? 'user' : 'admin',
                    'created_at' => $reply->created_at->toIso8601String(),
                ]);
            }
        }

        // 5. Pagsunod-sunurin ang lahat ng mensahe ayon sa petsa.
        $sortedMessages = $formattedMessages->sortBy('created_at')->values();

        return response()->json($sortedMessages);
    }

    /**
     * I-save ang bagong reply mula sa user.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. I-validate ang input.
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $user = Auth::user();

        // 2. Hanapin ang pinakabagong conversation thread na sinimulan ng user.
        $latestContactMessage = ContactMessage::where('user_id', $user->id)->latest()->first();

        // Kung walang nahanap na thread (hindi pa nakakapag-contact us), huwag magpatuloy.
        // Ito ay isang safety check.
        if (!$latestContactMessage) {
            return response()->json(['error' => 'No conversation thread found. Please send a message from the Contact Us page first.'], 404);
        }

        // 3. Gumawa ng bagong reply record.
        // Ang 'status' ay awtomatikong magiging 'unread' dahil sa default value sa database.
        Reply::create([
            'contact_message_id' => $latestContactMessage->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
        ]);
        
        // 4. I-update ang status ng PARENT message thread para ma-notify ang admin.
        // Mahalaga ito para lumabas sa notification counter ng admin.
        $latestContactMessage->update(['status' => 'unread']);

        return response()->json(['status' => 'success', 'message' => 'Reply sent successfully.'], 201);
    }
}