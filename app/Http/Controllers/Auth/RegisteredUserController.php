<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use App\Models\UserProfile;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB; 
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\RedirectResponse;
use Illuminate\Auth\Events\Registered;
use App\Models\WelcomeContent;
use App\Events\NewUserRegistered;
use App\Services\ImageCompressionService;
use App\Services\IdentityVerification\IdDocumentPrecheckService;
use Illuminate\Validation\ValidationException;
class RegisteredUserController extends Controller
{
    public function __construct(
        private ImageCompressionService $compressionService,
        private IdDocumentPrecheckService $idDocumentPrecheck
    ) {}

    /**
     * Display the registration view.
     */
     public function create(): Response
    {
   
        $footerData = WelcomeContent::first();

        return Inertia::render('Auth/Register', [
            'footerData' => $footerData, 
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
       public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'phone_number' => UserProfile::normalizePhoneNumber($request->phone_number),
        ]);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:20',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'province' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'street_address' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20|unique:user_profiles,phone_number',
            'birthday' => 'required|date',
            'gender' => 'required|string|in:Male,Female',
            'place_of_birth' => 'required|string|max:255',
            'civil_status' => 'required|string|max:50',
            'valid_id_type' => 'required|string|max:255',
            'valid_id_front_image' => 'required|file|mimes:jpeg,png,jpg,webp|max:10240',
            'valid_id_back_image' => 'required|file|mimes:jpeg,png,jpg,webp|max:10240',
            'face_image' => 'required|file|mimes:jpeg,png,jpg,webp|max:10240',
            'terms' => 'accepted',
        ]);

        $this->assertRegistrationImagesAreValid($request);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'resident',
                'two_factor_enabled' => true,
                'two_factor_method' => 'email',
                'email_verified_at' => now(),
                
            ]);

            // Handle file uploads with compression
            $idFrontPath = $this->compressionService->compress($request->file('valid_id_front_image'), 'id_images');
            $idBackPath = $this->compressionService->compress($request->file('valid_id_back_image'), 'id_images');
            $faceImagePath = $this->compressionService->compress($request->file('face_image'), 'face_images');

            $user->profile()->create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'middle_name' => $request->middle_name,
                'suffix' => $request->suffix,
                'province' => $request->province,
                'city' => $request->city,
                'barangay' => '',
                'street_address' => $request->street_address,
                'phone_number' => $request->phone_number,
                'birthday' => $request->birthday,
                'gender' => $request->gender,
                'place_of_birth' => $request->place_of_birth, 
                'civil_status' => $request->civil_status,
                'valid_id_type' => $request->valid_id_type,
                'valid_id_front_path' => $idFrontPath,
                'valid_id_back_path' => $idBackPath,
                'face_image_path' => $faceImagePath,
            ]);

            return $user;
        });

        event(new Registered($user));
        event(new NewUserRegistered($user));

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('residents.home');
    }

    private function assertRegistrationImagesAreValid(Request $request): void
    {
        $checks = [
            'valid_id_front_image' => $this->idDocumentPrecheck->check(
                $request->file('valid_id_front_image'),
                $request->valid_id_type,
                'front_id'
            ),
            'valid_id_back_image' => $this->idDocumentPrecheck->check(
                $request->file('valid_id_back_image'),
                $request->valid_id_type,
                'back_id'
            ),
            'face_image' => $this->idDocumentPrecheck->check(
                $request->file('face_image'),
                $request->valid_id_type,
                'selfie'
            ),
        ];

        foreach ($checks as $field => $result) {
            if (($result['status'] ?? null) === 'valid' && ($result['is_valid'] ?? false) === true) {
                continue;
            }

            throw ValidationException::withMessages([
                $field => $result['message'] ?? 'This uploaded image could not be validated. Please retake it.',
            ]);
        }
    }
}
