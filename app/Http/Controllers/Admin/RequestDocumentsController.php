<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Inertia\Inertia;

use Inertia\Response; // Import Response class

class RequestDocumentsController extends Controller
{
    public function index(): Response
    {
        // Eager load the user, user's profile, and document type
        $documentRequests = DocumentRequest::with(['user.profile', 'documentType'])->get();

        return Inertia::render('Admin/Request', [
            'documentRequests' => $documentRequests,
        ]);
    }
}