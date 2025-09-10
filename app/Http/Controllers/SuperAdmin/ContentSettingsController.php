<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WelcomeContent;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ContentSettingsController extends Controller
{
    public function show()
    {
        $settings = WelcomeContent::firstOrNew([]);
        return Inertia::render('SuperAdmin/SuperAdminSettings', [
            'initialSettingsData' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'footer_title' => 'nullable|string|max:255',
            'footer_subtitle' => 'nullable|string|max:255',
            'footer_address' => 'nullable|string',
            'footer_email' => 'nullable|email|max:255',
            'footer_phone' => 'nullable|string|max:255',
            'footer_logo_file' => 'nullable',
            'officials' => 'required|array|size:3',
            'officials.*.name' => 'nullable|string|max:255',
            'officials.*.position' => 'nullable|string|max:255',
            'officials_files' => 'nullable|array|size:3',
        ]);

        $settings = WelcomeContent::firstOrCreate([]);
        
        $dataToUpdate = $request->only(['footer_title', 'footer_subtitle', 'footer_address', 'footer_email', 'footer_phone']);
        $officialsData = $request->input('officials');
        
        for ($i = 0; $i < 3; $i++) {
            $currentPhotoPath = $settings->officials[$i]['photo_url'] ?? null;
            if (($request->input("officials_files.{$i}") ?? null) === 'remove' && $currentPhotoPath) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $currentPhotoPath));
                $officialsData[$i]['photo_url'] = null;
            } 
            elseif ($request->hasFile("officials_files.{$i}")) {
                if ($currentPhotoPath) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $currentPhotoPath));
                }
                $path = $request->file("officials_files.{$i}")->store('officials', 'public');
                $officialsData[$i]['photo_url'] = Storage::url($path);
            } else {
                 $officialsData[$i]['photo_url'] = $currentPhotoPath;
            }
        }
        $dataToUpdate['officials'] = $officialsData;

        if ($request->hasFile('footer_logo_file')) {
            if ($settings->footer_logo_url) { Storage::disk('public')->delete(str_replace('/storage/', '', $settings->footer_logo_url)); }
            $path = $request->file('footer_logo_file')->store('site_logos', 'public');
            $dataToUpdate['footer_logo_url'] = Storage::url($path);
        } elseif ($request->input('footer_logo_file') === 'remove') {
            if ($settings->footer_logo_url) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $settings->footer_logo_url));
                $dataToUpdate['footer_logo_url'] = null;
            }
        }
        
        $settings->update($dataToUpdate);

        return redirect()->back()->with('success', 'Content settings updated successfully.');
    }
}