<?php

namespace App\Http\Controllers\Resident\RequestPaper;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PaperController extends Controller
{
    public function jobSeeker(): Response|RedirectResponse
    {
        $documentType = DocumentType::where('name', 'Job Seeker')->first();
        $user = Auth::user();

        if (!$user->is_verified) {
            return redirect()->route('residents.home')
                ->with('error', 'Your account must be verified to request documents. Please wait for an admin to approve your credentials.');
        }

        if (!$documentType || $documentType->is_archived || !$documentType->is_requestable) {
            return redirect()->route('residents.home')
                ->with('error', 'Job Seeker certificate is not currently available for request.');
        }

        $userProfile = $user->profile;
        return Inertia::render('Residents/papers/JobSeeker', [
            'userProfile' => $userProfile,
            'documentType' => $documentType,
        ]);
    }

    public function oathOfUndertaking(): Response|RedirectResponse
    {
        $documentType = DocumentType::where('name', 'Oath of Undertaking')->first();
        $user = Auth::user();

        if (!$user->is_verified) {
            return redirect()->route('residents.home')
                ->with('error', 'Your account must be verified to request documents. Please wait for an admin to approve your credentials.');
        }

        if (!$documentType || $documentType->is_archived || !$documentType->is_requestable) {
            return redirect()->route('residents.home')
                ->with('error', 'Oath of Undertaking is not currently available for request.');
        }

        $userProfile = $user->profile;
        return Inertia::render('Residents/papers/OathOfUndertaking', [
            'userProfile' => $userProfile,
            'documentType' => $documentType,
        ]);
    }

    public function brgyBusinessPermit(): Response|RedirectResponse
    {
        $documentType = DocumentType::where('name', 'Brgy Business Permit')->first();
        $user = Auth::user();

        if (!$user->is_verified) {
            return redirect()->route('residents.home')
                ->with('error', 'Your account must be verified to request documents. Please wait for an admin to approve your credentials.');
        }

        if (!$documentType || $documentType->is_archived || !$documentType->is_requestable) {
            return redirect()->route('residents.home')
                ->with('error', 'Barangay Business Permit is not currently available for request.');
        }

        $userProfile = $user->profile;
        if ($userProfile) {
            $userProfile->append(['full_name', 'full_address']);
        }
        return Inertia::render('Residents/papers/BrgyBusinessPermit', [
            'userProfile' => $userProfile,
            'documentType' => $documentType,
        ]);
    }

    public function pagpapatunayEduk(): Response|RedirectResponse
    {
        $documentType = DocumentType::where('name', 'Pagpapatunay Eduk')->first();
        $user = Auth::user();

        if (!$user->is_verified) {
            return redirect()->route('residents.home')
                ->with('error', 'Your account must be verified to request documents. Please wait for an admin to approve your credentials.');
        }

        if (!$documentType || $documentType->is_archived || !$documentType->is_requestable) {
            return redirect()->route('residents.home')
                ->with('error', 'Pagpapatunay Eduk is not currently available for request.');
        }

        $userProfile = $user->profile;
        return Inertia::render('Residents/papers/PagpapatunayEduk', [
            'userProfile' => $userProfile,
            'documentType' => $documentType,
        ]);
    }
}
