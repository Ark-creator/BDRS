<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
// You might need to import your UserProfile model if it exists
// use App\Models\UserProfile;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; // DB Facade for transactions
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
        // --- UPDATED VALIDATION RULES ---
        $request->validate([
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
            // profile_picture_url is usually handled by a file upload, so we'll just validate it as a string for now
            'profile_picture_url' => 'nullable|string|max:255',
        ]);

        // Wrap the creation of two records in a database transaction.
        // This ensures that if the profile creation fails, the user creation is also rolled back.
        $user = DB::transaction(function () use ($request) {
            
            // Create the User record with authentication-related data
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'resident', // Default role for all new registrations
            ]);

            // Create the associated UserProfile record using the relationship
            // This assumes you have a `profile()` relationship defined in your User model.
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
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('residents.home', absolute: false));
    }

    
}