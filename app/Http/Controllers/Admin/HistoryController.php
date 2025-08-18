<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImmutableDocumentsArchiveHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only('search', 'status');

        $archives = ImmutableDocumentsArchiveHistory::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user.profile', function ($subQuery) use ($search) {
                        $subQuery->where('first_name', 'like', "%{$search}%")
                                 ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('documentType', function ($subQuery) use ($search) {
                        $subQuery->where('name', 'like', "%{$search}%");
                    });
                });
            })
            ->when(($filters['status'] ?? 'All') !== 'All', function ($query) use ($filters) {
                $query->where('status', $filters['status']);
            })
            ->with(['user.profile', 'documentType', 'processor.profile'])
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/History', [
            'archives' => $archives,
            'filters' => $filters,
        ]);
    }
}