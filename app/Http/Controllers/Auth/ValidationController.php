<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\UserProfile; // Make sure you have a UserProfile model
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class ValidationController extends Controller
{
    /**
     * Check if a phone number is already taken.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkPhone(Request $request)
    {
        // 1. First, validate the input to ensure it's a valid format
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string|min:10|max:20', // Basic sanity check
        ]);

        if ($validator->fails()) {
            // If input is invalid, report it as taken to prevent misuse
            return response()->json(['is_taken' => true]);
        }

        // 2. Check if the phone number exists in the database
        $isTaken = UserProfile::where('phone_number', $request->phone_number)->exists();

        // 3. Return a simple JSON response
        return response()->json([
            'is_taken' => $isTaken,
        ]);

    }

     public function checkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['is_taken' => true]);
        }
        
        // Check the 'users' table
        $isTaken = User::where('email', $request->email)->exists();

        return response()->json(['is_taken' => $isTaken]);
    }

}