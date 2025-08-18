<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\User;
use App\Models\Payment; // Assuming you have a Payment model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the admin dashboard with aggregated data.
     */
    public function index()
    {
        // --- STATS CARDS DATA ---
        $totalResidents = User::where('role', 'resident')->count(); // Count only residents
        $pendingRequestsCount = DocumentRequest::where('status', 'pending')->count();
        // Assuming a Payment model and 'completed' status for successful payments
        $monthlyRevenue = Payment::where('status', 'completed')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        // --- PENDING REQUESTS TABLE DATA (Top 5 for the dashboard) ---
        $pendingRequests = DocumentRequest::with(['user.profile', 'documentType']) // <--- #1. I-load ang user AT ang profile nito
    ->where('status', 'pending')
    ->latest()
    ->take(5)
    ->get()
    ->map(fn ($request) => [
        'id' => $request->id,
        'name' => $request->user->full_name, // <--- #2. Gamitin ang "full_name" accessor
        'docType' => $request->documentType->name,
        'date' => $request->created_at->format('M d, Y'),
    ]);

        // --- DOCUMENT BREAKDOWN PIE CHART DATA ---
        $documentBreakdown = DocumentRequest::select('document_type_id', DB::raw('count(*) as value'))
            ->groupBy('document_type_id')
            ->with('documentType:id,name') // Only select id and name from documentType for efficiency
            ->get()
            ->map(fn ($item) => [
                'name' => $item->documentType->name,
                'value' => $item->value,
            ]);
            
        // --- RECENT ACTIVITY FEED DATA (Latest 5 completed requests) ---
        $recentActivities = DocumentRequest::with(['user', 'documentType'])
            ->whereIn('status', ['completed', 'claimed'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($request) => [
                'id' => $request->id,
                'user' => $request->user->name,
                'text' => "processed a request for {$request->documentType->name}.",
                'time' => $request->updated_at->diffForHumans(),
                'type' => 'request_completed', // Custom type for icon mapping
            ]);


        return Inertia::render('Admin/AdminDashboard', [
            'stats' => [
                ['icon' => 'Users', 'title' => "Total Residents", 'value' => $totalResidents, 'color' => ['bg' => 'bg-blue-100 dark:bg-blue-900/50', 'text' => 'text-blue-600 dark:text-blue-300']],
                ['icon' => 'FolderGit', 'title' => "Pending Requests", 'value' => $pendingRequestsCount, 'color' => ['bg' => 'bg-yellow-100 dark:bg-yellow-900/50', 'text' => 'text-yellow-600 dark:text-yellow-300']],
                ['icon' => 'Banknote', 'title' => "Revenue (This Month)", 'value' => "₱" . number_format($monthlyRevenue, 2), 'color' => ['bg' => 'bg-green-100 dark:bg-green-900/50', 'text' => 'text-green-600 dark:text-green-300']],
                ['icon' => 'Building', 'title' => "System Status", 'value' => "Operational", 'color' => ['bg' => 'bg-teal-100 dark:bg-teal-900/50', 'text' => 'text-teal-600 dark:text-teal-300']],
            ],
            'pendingRequests' => $pendingRequests,
            'documentBreakdown' => $documentBreakdown,
            'recentActivities' => $recentActivities,
        ]);
    }
}