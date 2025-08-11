<?php

namespace App\Http\Controllers\Auth;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Route;
use App\Http\Requests\Auth\LoginRequest;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }
    public function index()
{
    return Inertia::render('SuperAdmin/Users/Index', [
        // Tell Laravel to fetch the id, name, email, role, and created_at columns
        'users' => User::select('id', 'name', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
    ]);
}

    /**
     * Handle an incoming authentication request.
     */
   public function store(LoginRequest $request): RedirectResponse
        {
            $request->authenticate();

            $request->session()->regenerate();

            $user = Auth::user();

            // 🚫 Check kung inactive ang status
            if ($user->status === 'inactive') {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Your account is inactive. Please contact the administrator.',
                ]);
            }

            if ($user->role === 'super_admin') {
                return redirect()->intended(route('residents.home', absolute: false));
            } elseif ($user->role === 'admin') {
                return redirect()->intended(route('residents.home', absolute: false));
            } else {
                return redirect()->intended(route('residents.home', absolute: false));
            }
        }



    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
