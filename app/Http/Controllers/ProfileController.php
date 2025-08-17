<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
{
    // Idagdag ang linyang ito para i-define ang $user at kunin ang kanyang profile
    $user = $request->user()->load('profile');

    return Inertia::render('Profile/Edit', [
        'mustVerifyEmail' => $user instanceof MustVerifyEmail,
        'status' => session('status'),
        'userProfile' => $user->profile,
    ]);
}

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        // Idagdag ang validation para sa mga bagong fields
        $request->validate([
            'first_name'   => 'required|string|max:255',
            'middle_name'  => 'nullable|string|max:255',
            'last_name'    => 'required|string|max:255',
            'email'        => 'required|email|max:255|unique:users,email,' . auth()->id(),
            'phone_number' => 'nullable|string|max:20',
            // --- BAGONG VALIDATION RULES ---
            'address'      => 'nullable|string|max:500',
            'birthday'     => 'nullable|date',
            'gender'       => 'nullable|string|in:Male,Female,Other',
            'civil_status' => 'nullable|string|in:Single,Married,Widowed,Separated',
        ]);

        $user = $request->user();
        $user->email = $request->email;
        $user->save();

        // Idagdag ang mga bagong fields sa pag-update ng profile
        $user->profile()->update([
            'first_name'   => $request->first_name,
            'middle_name'  => $request->middle_name,
            'last_name'    => $request->last_name,
            'phone_number' => $request->phone_number,
            // --- BAGONG FIELDS PARA I-SAVE ---
            'address'      => $request->address,
            'birthday'     => $request->birthday,
            'gender'       => $request->gender,
            'civil_status' => $request->civil_status,
        ]);

        return back()->with('success', 'Profile updated successfully.');
    }
    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
{
    $request->validate([
        'password' => ['required', 'current_password'],
    ]);

    $user = $request->user();

    // Log out before modifying the account
    Auth::logout();

    // Instead of deleting, update status
    $user->status = 'inactive';
    $user->save();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return Redirect::to('/');
}

}
