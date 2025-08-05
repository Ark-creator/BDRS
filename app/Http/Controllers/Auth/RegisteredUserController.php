<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // <-- 1. IMPORT THE DB FACADE
use Illuminate\Support\Facades\Hash;
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
        // 2. UPDATED VALIDATION RULES
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            // Add other profile fields here if they are in your registration form
            // e.g., 'phone_number' => 'nullable|string|max:20|unique:user_profiles',
        ]);

        // 3. WRAP CREATION IN A DATABASE TRANSACTION
        $user = DB::transaction(function () use ($request) {
            
            // 4. CREATE THE USER with only user-specific data
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'resident', // Set the default role for all new registrations
            ]);

            // 5. CREATE THE USER PROFILE using the relationship
            $user->profile()->create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middle_name' => $request->middle_name,
                 'phone_number' => $request->phone_number,
        'address' => $request->address,  
        'birthday' => $request->birthday,
        'gender' => $request->gender,
        'civil_status' => $request->civil_status,
        'profile_picture_url' => $request->profile_picture_url,
                // Add other fields here if they are in the request
                // 'phone_number' => $request->phone_number,
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}