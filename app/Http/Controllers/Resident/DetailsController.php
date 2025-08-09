<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Import the Auth facade
use Inertia\Inertia;                 // Import Inertia
use Inertia\Response;                // For type-hinting

class DetailsController extends Controller
{
    /**
     * Display the Barangay Clearance form and pass user profile data.
     */
    public function brgyClearance(): Response
{
    $userProfile = Auth::user()->profile;

    // Calculate age using Carbon and add it to the profile object
    if ($userProfile->birthday) {
        $userProfile->age = \Carbon\Carbon::parse($userProfile->birthday)->age;
    }

    return Inertia::render('Residents/papers/BrgyClearance', [
        'userProfile' => $userProfile
    ]);
}
}