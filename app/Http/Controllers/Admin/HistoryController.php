<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\ImmutableDocumentsArchiveHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    /**
     * Display the archive history list.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only('search', 'status');

        $archives = ImmutableDocumentsArchiveHistory::query()
            ->select(['id', 'user_id', 'document_type_id', 'processed_by', 'status', 'admin_remarks', 'original_request_id', 'original_created_at', 'created_at'])
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
            ->with(['user.profile:user_id,first_name,middle_name,last_name', 'documentType:id,name', 'processor.profile:user_id,first_name,middle_name,last_name'])
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/History', [
            'archives' => $archives,
            'filters' => $filters,
        ]);
    }

    /**
     * Restore a rejected request from the archive back to active requests.
     */
    public function restore(ImmutableDocumentsArchiveHistory $archive): RedirectResponse
    {
        if ($archive->status !== 'Rejected') {
            return Redirect::back()->with('error', 'Only rejected requests can be restored.');
        }

        try {
            DB::transaction(function () use ($archive) {
                // FIX 2: Use the correct column name from your model
                $originalRequest = DocumentRequest::find($archive->original_request_id);

                if ($originalRequest) {
                    $originalRequest->update([
                        'status' => 'Processing',
                        // 'admin_remarks' => 'Restored from archive. Original rejection reason: ' . ($archive->admin_remarks ?: 'N/A'),
                    ]);

                    $archive->delete();
                } else {
                    // This will roll back the transaction if the original request is not found
                    throw new \Exception('Original document request not found. Cannot restore.');
                }
            });
        } catch (\Exception $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }

        return Redirect::back()->with('success', 'Request has been restored and moved to active requests.');
    }
}
