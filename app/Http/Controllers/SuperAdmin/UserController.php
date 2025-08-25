<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a list of all users.
     */
    public function index(Request $request)
    {
        // Authorization check
        if (Gate::denies('be-super-admin')) {
            abort(403, 'Unauthorized action.');
        }

        $query = User::with('profile')
            ->orderBy($request->input('sortBy', 'created_at'), $request->input('sortOrder', 'desc'));

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhereHas('profile', function ($profileQuery) use ($search) {
                      $profileQuery->where('first_name', 'like', "%{$search}%")
                                   ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('role') && $request->input('role') !== 'all') {
            $query->where('role', $request->input('role'));
        }

        // Corrected the view path to match the JSX component name
        return Inertia::render('SuperAdmin/Users/Usermanagement', [
            'users' => $query->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'role', 'sortBy', 'sortOrder']),
        ]);
    }

    /**
     * Update the role of a specific user.
     */
    public function updateRole(Request $request, User $user)
    {
        if ($user->id === auth()->id()) {
            return Redirect::back()->with('error', 'You cannot change your own role.');
        }

        $request->validate([
            'role' => ['required', 'string', Rule::in(['resident', 'admin'])],
        ]);

        if ($user->role === 'super_admin') {
             return Redirect::back()->with('error', 'Cannot change the role of another Super Admin.');
        }

        $user->role = $request->role;
        $user->save();

        return Redirect::back()->with('success', "{$user->profile->first_name}'s role updated successfully.");
    }

    /**
     * NEW: Update the verification status of a specific user.
     * This method is called from the VerificationModal.
     */
    public function updateVerificationStatus(Request $request, User $user)
    {
        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['verified', 'rejected', 'unverified'])],
        ]);

        $user->update($validated);

        return Redirect::back()->with('success', "User verification status has been updated.");
    }


    /**
     * Update the user's profile and core details.
     */
    public function update(Request $request, User $user)
    {
        $validatedData = $request->validate([
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'profile.first_name' => 'required|string|max:255',
            'profile.middle_name' => 'nullable|string|max:255',
            'profile.last_name' => 'required|string|max:255',
            'profile.phone_number' => 'nullable|string|max:20',
            'profile.address' => 'nullable|string|max:255',
            'profile.civil_status' => ['nullable', 'string', Rule::in(['Single', 'Married', 'Widowed', 'Separated'])],
        ]);

        // Update User model
        $user->update([
            'email' => $validatedData['email'],
        ]);

        // Update or Create UserProfile
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $validatedData['profile']
        );

        return Redirect::back()->with('success', 'User details updated successfully.');
    }
}
