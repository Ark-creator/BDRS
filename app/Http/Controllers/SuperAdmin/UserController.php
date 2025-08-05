<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;

class UserController extends Controller
{
    /**
     * Display a list of all users.
     */
    public function index()
    {
        return Inertia::render('SuperAdmin/Users/Usermanagement', [
            // We use paginate() for better performance with many users.
            'users' => User::orderBy('created_at', 'desc')->paginate(10)
        ]);
    }

    /**
     * Update the role of a specific user.
     */
    public function updateRole(Request $request, User $user)
    {
        // Prevent a super admin from accidentally demoting themselves
        if ($user->id === auth()->id() && $request->role !== 'super_admin') {
            return Redirect::back()->with('error', 'You cannot change your own role.');
        }

        $request->validate([
            'role' => 'required|string|in:resident,admin,super_admin',
        ]);

        $user->role = $request->role;
        $user->save();

        return Redirect::back()->with('success', 'User role updated successfully.');
    }
}