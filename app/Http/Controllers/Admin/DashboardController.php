<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\User;
use App\Models\Payment;
use App\Models\ImmutableDocumentsArchiveHistory; // 1. I-IMPORT ANG ARCHIVE MODEL
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // --- STATS CARDS DATA (Walang pagbabago dito) ---
        $totalResidents = User::where('role', 'resident')->count();
        $pendingRequestsCount = DocumentRequest::where('status', 'Pending')->count();
        $monthlyRevenue = Payment::where('status', 'completed')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');

        // --- PENDING REQUESTS TABLE DATA (Walang pagbabago dito) ---
        $pendingRequests = DocumentRequest::with(['user.profile', 'documentType'])
            ->where('status', 'Pending')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($request) => [
                'id' => $request->id,
                'name' => $request->user->full_name,
                'docType' => $request->documentType->name,
                'date' => $request->created_at->format('M d, Y'),
            ]);

        // --- DOCUMENT BREAKDOWN PIE CHART DATA (Walang pagbabago dito) ---
        $documentBreakdown = DocumentRequest::select('document_type_id', DB::raw('count(*) as value'))
            ->groupBy('document_type_id')
            ->with('documentType:id,name')
            ->get()
            ->map(fn ($item) => [
                'name' => $item->documentType->name,
                'value' => $item->value,
            ]);
            
        // --- RECENT ACTIVITY FEED DATA (ITO ANG BINAGO) ---
        // 2. Kunin ang data mula sa `ImmutableDocumentsArchiveHistory` table
        $recentActivities = ImmutableDocumentsArchiveHistory::with(['user.profile', 'documentType', 'processor.profile'])
            ->whereIn('status', ['Claimed', 'Rejected']) // 3. Kunin ang tamang statuses
            ->latest('created_at') // Pagbukud-bukurin ayon sa kung kailan na-archive
            ->take(5)
            ->get()
            ->map(fn ($archive) => [
                'id' => $archive->id,
                'processor_name' => $archive->processor->full_name ?? 'An Admin', // Pangalan ng admin na nag-proseso
                'status' => $archive->status,
                'document_name' => $archive->documentType->name,
                'time' => $archive->created_at->diffForHumans(), // Oras mula nang ma-archive
                'type' => $archive->status === 'Claimed' ? 'request_completed' : 'request_rejected', // Para sa icon
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
            'recentActivities' => $recentActivities, // Ipadala ang bagong data
        ]);
    }
}