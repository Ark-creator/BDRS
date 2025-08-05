<?php

namespace App\Http\Controllers\SuperAdmin;

use Gate;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
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
'users' => User::select('id', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(10)        ]);
    

      if (Gate::denies('be-super-admin')) {
        dd('Gate check failed for role: ' . auth()->user()->role);
    }
    return 'You passed!';
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