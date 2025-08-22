<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ImmutableDocumentsArchiveHistory;
use Illuminate\Support\Facades\Auth;

class HistoryController extends Controller
{
    /**
     * Display the history of the authenticated user's requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        $filters = $request->only('search');
        $userId = Auth::id(); // Get the authenticated user's ID

        $requestHistory = ImmutableDocumentsArchiveHistory::query()
            ->where('user_id', $userId) 
            // Fetch both 'Rejected' and 'Claimed' statuses
            ->whereIn('status', ['Rejected', 'Claimed'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('documentType', function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', "%{$search}%");
                });
            })
            ->with(['documentType', 'processor.profile'])
            ->latest('original_created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Residents/History', [
            // Pass the history data to the component
            'requestHistory' => $requestHistory,
            'filters' => $filters,
        ]);
    }
}
