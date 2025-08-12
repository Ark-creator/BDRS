<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class MessagesController extends Controller
{
    public function index(Request $request): Response
    {
        $subjects = ['General Inquiry', 'Feedback', 'Support', 'Complaint'];
        $query = ContactMessage::with('user.profile')->latest();

        if ($request->has('subject') && in_array($request->subject, $subjects)) {
            $query->where('subject', $request->subject);
        }

        $messages = $query->get();

        return Inertia::render('Admin/Messages', [
            'messages' => $messages,
            'subjects' => $subjects,
            'currentSubject' => $request->subject,
        ]);
    }

    public function updateStatus(ContactMessage $message): RedirectResponse
    {
        $message->update(['status' => 'read']);
        return redirect()->route('admin.messages')->with('success', 'Message status updated to read.');
    }
}