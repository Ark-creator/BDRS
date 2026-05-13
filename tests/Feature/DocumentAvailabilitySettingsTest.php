<?php

namespace Tests\Feature;

use App\Models\DocumentType;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentAvailabilitySettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_toggle_document_request_availability(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $documentType = DocumentType::create([
            'name' => 'Barangay Clearance',
            'description' => 'A clearance from the barangay office.',
            'template_path' => 'templates/brgy_clearance.blade.php',
            'barangay_id' => $superAdmin->barangay_id,
        ]);

        $response = $this->actingAs($superAdmin)->patch(route('superadmin.settings.update'), [
            'footer_title' => 'BDRS',
            'footer_subtitle' => 'Document Request System',
            'footer_address' => 'Barangay Hall',
            'footer_email' => 'barangay@example.com',
            'footer_phone' => '09123456789',
            'officials' => [
                ['name' => 'Official 1', 'position' => 'Captain', 'photo_url' => null],
                ['name' => 'Official 2', 'position' => 'Secretary', 'photo_url' => null],
                ['name' => 'Official 3', 'position' => 'Treasurer', 'photo_url' => null],
            ],
            'officials_files' => [null, null, null],
            'email_verification_enabled' => true,
            'document_availability' => [
                ['name' => 'Barangay Clearance', 'is_requestable' => false],
            ],
        ]);

        $response->assertRedirect();
        $this->assertTrue(SystemSetting::emailVerificationEnabled());
        $this->assertFalse($documentType->fresh()->is_requestable);
    }

    public function test_residents_cannot_open_disabled_document_request_form(): void
    {
        $resident = User::factory()->create(['verification_status' => 'verified']);
        $documentType = DocumentType::create([
            'name' => 'Job Seeker',
            'description' => 'A certificate for Job Seekers.',
            'template_path' => 'templates/job_seeker_template.docx',
            'barangay_id' => $resident->barangay_id,
            'is_requestable' => false,
        ]);

        $this->actingAs($resident)
            ->get(route('residents.request.create', $documentType))
            ->assertRedirect(route('residents.home'))
            ->assertSessionHas('error', 'This document is not currently available for request.');
    }

    public function test_residents_cannot_submit_disabled_document_request(): void
    {
        $resident = User::factory()->create(['verification_status' => 'verified']);
        $documentType = DocumentType::create([
            'name' => 'Job Seeker',
            'description' => 'A certificate for Job Seekers.',
            'template_path' => 'templates/job_seeker_template.docx',
            'barangay_id' => $resident->barangay_id,
            'is_requestable' => false,
        ]);

        $this->actingAs($resident)
            ->post(route('residents.request.store'), [
                'document_type_id' => $documentType->id,
            ])
            ->assertSessionHas('error', 'This document is not currently available for request.');
    }
}
