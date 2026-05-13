<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DocumentType;
use App\Models\SystemSetting;
use App\Models\WelcomeContent;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageCompressionService;

class ContentSettingsController extends Controller
{
    public function __construct(
        private ImageCompressionService $compressionService
    ) {}

    private function publicDisk(): string
    {
        return config('filesystems.public_uploads_disk', 's3');
    }

    private function storedPathFromUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH) ?: $url;
        $storagePrefix = '/storage/';

        if (str_starts_with($path, $storagePrefix)) {
            return ltrim(substr($path, strlen($storagePrefix)), '/');
        }

        $diskUrl = config("filesystems.disks.{$this->publicDisk()}.url");
        if ($diskUrl && str_starts_with($url, rtrim($diskUrl, '/') . '/')) {
            return ltrim(substr($url, strlen(rtrim($diskUrl, '/') . '/')), '/');
        }

        return ltrim($path, '/');
    }

    public function show()
    {
        $settings = WelcomeContent::firstOrNew([]);

        $documentAvailability = DocumentType::withoutGlobalScopes()
            ->orderBy('name')
            ->get(['id', 'name', 'is_requestable', 'barangay_id'])
            ->groupBy('name')
            ->map(fn ($documents, string $name) => [
                'name' => $name,
                'is_requestable' => $documents->every(fn (DocumentType $document) => $document->is_requestable),
                'available_count' => $documents->where('is_requestable', true)->count(),
                'total_count' => $documents->count(),
            ])
            ->values();

        return Inertia::render('SuperAdmin/SuperAdminSettings', [
            'initialSettingsData' => $settings,
            'systemSettings' => [
                'email_verification_enabled' => SystemSetting::emailVerificationEnabled(),
            ],
            'documentAvailability' => $documentAvailability,
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
            'email_verification_enabled' => 'required',
            'document_availability' => 'nullable|array',
            'document_availability.*.name' => 'required|string|max:255',
            'document_availability.*.is_requestable' => 'required',
        ]);

        $settings = WelcomeContent::firstOrCreate([]);

        SystemSetting::setValue(
            SystemSetting::EMAIL_VERIFICATION_ENABLED,
            $request->boolean('email_verification_enabled')
        );

        foreach ($request->input('document_availability', []) as $documentSetting) {
            DocumentType::withoutGlobalScopes()
                ->where('name', $documentSetting['name'])
                ->update([
                    'is_requestable' => filter_var($documentSetting['is_requestable'], FILTER_VALIDATE_BOOLEAN),
                ]);
        }
        
        $dataToUpdate = $request->only(['footer_title', 'footer_subtitle', 'footer_address', 'footer_email', 'footer_phone']);
        $officialsData = $request->input('officials');
        
        for ($i = 0; $i < 3; $i++) {
            $currentPhotoPath = $settings->officials[$i]['photo_url'] ?? null;
            if (($request->input("officials_files.{$i}") ?? null) === 'remove' && $currentPhotoPath) {
                Storage::disk($this->publicDisk())->delete($this->storedPathFromUrl($currentPhotoPath));
                $officialsData[$i]['photo_url'] = null;
            } 
            elseif ($request->hasFile("officials_files.{$i}")) {
                if ($currentPhotoPath) {
                    Storage::disk($this->publicDisk())->delete($this->storedPathFromUrl($currentPhotoPath));
                }
                $path = $this->compressionService->compress($request->file("officials_files.{$i}"), 'officials', 80);
                $officialsData[$i]['photo_url'] = Storage::disk($this->publicDisk())->url($path);
            } else {
                 $officialsData[$i]['photo_url'] = $currentPhotoPath;
            }
        }
        $dataToUpdate['officials'] = $officialsData;

        if ($request->hasFile('footer_logo_file')) {
            if ($settings->footer_logo_url) { Storage::disk($this->publicDisk())->delete($this->storedPathFromUrl($settings->footer_logo_url)); }
            $path = $this->compressionService->compress($request->file('footer_logo_file'), 'site_logos', 85);
            $dataToUpdate['footer_logo_url'] = Storage::disk($this->publicDisk())->url($path);
        } elseif ($request->input('footer_logo_file') === 'remove') {
            if ($settings->footer_logo_url) {
                Storage::disk($this->publicDisk())->delete($this->storedPathFromUrl($settings->footer_logo_url));
                $dataToUpdate['footer_logo_url'] = null;
            }
        }
        
        $settings->update($dataToUpdate);

        return redirect()->back()->with('success', 'Content settings updated successfully.');
    }
}
