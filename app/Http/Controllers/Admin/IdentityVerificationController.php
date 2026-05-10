<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\IdentityVerification\ReviewVerificationRequest;
use App\Models\Verification;
use App\Services\IdentityVerification\IdentityVerificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IdentityVerificationController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Verification::query()
            ->with([
                'user.profile',
                'reviewer',
                'fraudAlerts' => fn ($query) => $query->latest(),
                'logs' => fn ($query) => $query->latest()->limit(5),
            ])
            ->latest();

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where(function ($query) use ($search): void {
                $query->where('uuid', 'like', "%{$search}%")
                    ->orWhere('document_type', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($userQuery) => $userQuery->where('email', 'like', "%{$search}%"))
                    ->orWhereHas('user.profile', function ($profileQuery) use ($search): void {
                        $profileQuery->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $user = $request->user();
        if ($user->role !== 'super_admin') {
            $query->whereHas('user', fn ($userQuery) => $userQuery->where('barangay_id', $user->barangay_id));
        }

        $verifications = $query->paginate(12)->withQueryString();
        $summaryQuery = Verification::query();
        if ($user->role !== 'super_admin') {
            $summaryQuery->whereHas('user', fn ($userQuery) => $userQuery->where('barangay_id', $user->barangay_id));
        }

        return Inertia::render('Admin/Verifications', [
            'verifications' => $verifications,
            'filters' => [
                'status' => $request->input('status', 'all'),
                'search' => $request->input('search', ''),
            ],
            'summary' => [
                'queued' => (clone $summaryQuery)->where('status', Verification::STATUS_QUEUED)->count(),
                'processing' => (clone $summaryQuery)->where('status', Verification::STATUS_PROCESSING)->count(),
                'review_required' => (clone $summaryQuery)->where('status', Verification::STATUS_REVIEW_REQUIRED)->count(),
                'approved' => (clone $summaryQuery)->where('status', Verification::STATUS_APPROVED)->count(),
                'rejected' => (clone $summaryQuery)->where('status', Verification::STATUS_REJECTED)->count(),
            ],
            'statuses' => [
                'all',
                Verification::STATUS_DRAFT,
                Verification::STATUS_QUEUED,
                Verification::STATUS_PROCESSING,
                Verification::STATUS_REVIEW_REQUIRED,
                Verification::STATUS_APPROVED,
                Verification::STATUS_REJECTED,
                Verification::STATUS_FAILED,
            ],
        ]);
    }

    public function review(
        ReviewVerificationRequest $request,
        Verification $verification,
        IdentityVerificationService $service
    ): RedirectResponse {
        $service->review(
            $verification,
            $request->user(),
            (string) $request->input('status'),
            $request->input('notes'),
            $request
        );

        return back()->with('success', 'Verification review saved.');
    }
}
