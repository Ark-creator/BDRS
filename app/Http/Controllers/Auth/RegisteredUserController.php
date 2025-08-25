<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // DB Facade for transactions
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage; // Add Storage facade
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
{
    $validatedData = $request->validate([
        'first_name' => 'required|string|max:255',
        'last_name' => 'required|string|max:255',
        'middle_name' => 'nullable|string|max:255',
        'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
        'password' => ['required', 'confirmed', Rules\Password::defaults()],
        'address' => 'required|string|max:255',
        'phone_number' => 'nullable|string|max:20|unique:user_profiles,phone_number',
        'birthday' => 'nullable|date',
        'gender' => 'nullable|string|in:Male,Female,Other',
        'civil_status' => 'nullable|string|max:50',
        'profile_picture_url' => 'nullable|string|max:255',

        // --- FILE UPLOADS VALIDATION ---
        'valid_id_type' => 'required|string|max:255',
        'valid_id_front_image' => 'required|file|mimes:jpeg,png,jpg,gif|max:2048',
        'valid_id_back_image' => 'required|file|mimes:jpeg,png,jpg,gif|max:2048',
        'face_image' => 'required|file|mimes:jpeg,png,jpg,gif|max:2048',
        // --- END OF FILE VALIDATION ---
    ]);

    $user = DB::transaction(function () use ($request) {
        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'resident',
            'two_factor_enabled' => true
        ]);

        // --- HANDLE FILE UPLOADS ---
        $idFrontPath = $request->file('valid_id_front_image')->store('id_images', 'public');
        $idBackPath = $request->file('valid_id_back_image')->store('id_images', 'public');
        $faceImagePath = $request->file('face_image')->store('face_images', 'public');
        // --- END OF FILE UPLOADS ---

        $user->profile()->create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'middle_name' => $request->middle_name,
            'address' => $request->address,
            'phone_number' => $request->phone_number,
            'birthday' => $request->birthday,
            'gender' => $request->gender,
            'civil_status' => $request->civil_status,
            'profile_picture_url' => $request->profile_picture_url,

            // --- SAVE FILE PATHS ---
            'valid_id_type' => $request->valid_id_type,
            'valid_id_front_path' => $idFrontPath,
            'valid_id_back_path' => $idBackPath,
            'face_image_path' => $faceImagePath,
            // --- END OF SAVING FILE PATHS ---
        ]);

        return $user;
    });

    event(new Registered($user));
    // Auth::login($user);

        return redirect(route('verification.notice'));
}
}
