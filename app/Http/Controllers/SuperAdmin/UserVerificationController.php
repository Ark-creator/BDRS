<?php

// app/Http/Controllers/SuperAdmin/UserVerificationController.php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserVerificationController extends Controller
{
    /**
     * Update the verification status of a user.
     */
    public function update(Request $request, User $user)
    {
        // Authorize that the authenticated user is an admin or super_admin
        if (!auth()->user()->is_superadmin) { // Or whatever your admin role check is
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'verification_status' => ['required', 'in:unverified,pending_verification,verified,rejected'],
        ]);

        $user->update($validated);

        return back()->with('success', "User verification status updated to {$validated['verification_status']}.");
    }
}