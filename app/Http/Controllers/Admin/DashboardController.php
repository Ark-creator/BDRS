<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest; // <-- 1. Import the DocumentRequest model
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard.
     * This will show a list of all document requests.
     */
    public function index()
    {
        // 2. Fetch the document requests
        $requests = DocumentRequest::with(['user', 'documentType']) // Eager load relationships to prevent N+1 queries
            ->orderBy('created_at', 'desc') // Show the newest requests first
            ->paginate(10); // Paginate the results

        // 3. Render the React component and pass the requests data as a prop
        return Inertia::render('Admin/AdminDashboard', [
            'documentRequests' => $requests,
        ]);
    }
}