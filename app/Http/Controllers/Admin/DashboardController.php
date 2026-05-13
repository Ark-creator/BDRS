<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\ImmutableDocumentsArchiveHistory;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = Cache::remember('admin.dashboard.stats', now()->addMinutes(2), function () {
            $totalResidents = User::where('role', 'resident')->count();
            $pendingRequestsCount = DocumentRequest::where('status', 'Pending')->count();
            $monthlyRevenue = Payment::where('status', 'completed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount');

            return [
                ['icon' => 'Users', 'title' => 'Total Residents', 'value' => $totalResidents, 'color' => ['bg' => 'bg-blue-100 dark:bg-blue-900/50', 'text' => 'text-blue-600 dark:text-blue-300']],
                ['icon' => 'FolderGit', 'title' => 'Pending Requests', 'value' => $pendingRequestsCount, 'color' => ['bg' => 'bg-yellow-100 dark:bg-yellow-900/50', 'text' => 'text-yellow-600 dark:text-yellow-300']],
                ['icon' => 'Banknote', 'title' => 'Revenue (This Month)', 'value' => "\u{20B1}".number_format($monthlyRevenue, 2), 'color' => ['bg' => 'bg-green-100 dark:bg-green-900/50', 'text' => 'text-green-600 dark:text-green-300']],
                ['icon' => 'Building', 'title' => 'System Status', 'value' => 'Operational', 'color' => ['bg' => 'bg-teal-100 dark:bg-teal-900/50', 'text' => 'text-teal-600 dark:text-teal-300']],
            ];
        });

        $pendingRequests = DocumentRequest::select(['id', 'user_id', 'document_type_id', 'created_at', 'status'])
            ->with(['user.profile:user_id,first_name,middle_name,last_name', 'documentType:id,name'])
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

        $documentBreakdown = Cache::remember('admin.dashboard.breakdown', now()->addMinutes(10), function () {
            return DocumentRequest::select('document_type_id', DB::raw('count(*) as value'))
                ->groupBy('document_type_id')
                ->with('documentType:id,name')
                ->get()
                ->map(fn ($item) => [
                    'name' => $item->documentType->name,
                    'value' => $item->value,
                ]);
        });

        $recentActivities = ImmutableDocumentsArchiveHistory::select(['id', 'user_id', 'document_type_id', 'processed_by', 'status', 'created_at'])
            ->with(['user.profile:user_id,first_name,middle_name,last_name', 'documentType:id,name', 'processor.profile:user_id,first_name,middle_name,last_name'])
            ->whereIn('status', ['Claimed', 'Rejected'])
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($archive) => [
                'id' => $archive->id,
                'processor_name' => $archive->processor->full_name ?? 'An Admin',
                'status' => $archive->status,
                'document_name' => $archive->documentType->name,
                'time' => $archive->created_at->diffForHumans(),
                'type' => $archive->status === 'Claimed' ? 'request_completed' : 'request_rejected',
            ]);

        return Inertia::render('Admin/AdminDashboard', [
            'stats' => $stats,
            'pendingRequests' => $pendingRequests,
            'documentBreakdown' => $documentBreakdown,
            'recentActivities' => $recentActivities,
        ]);
    }
}
