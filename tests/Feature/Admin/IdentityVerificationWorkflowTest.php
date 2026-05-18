<?php

namespace Tests\Feature\Admin;

use App\Models\Barangay;
use App\Models\Municipality;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IdentityVerificationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Barangay $barangayA;
    private Barangay $barangayB;

    protected function setUp(): void
    {
        parent::setUp();
        $municipality = Municipality::create(['name' => 'Test Municipality', 'province' => 'Test Province']);
        $this->barangayA = Barangay::create(['municipality_id' => $municipality->id, 'name' => 'Barangay A']);
        $this->barangayB = Barangay::create(['municipality_id' => $municipality->id, 'name' => 'Barangay B']);
    }

    public function test_admin_can_list_verifications(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'barangay_id' => $this->barangayA->id]);
        Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create(['barangay_id' => $this->barangayA->id])->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_DRAFT,
        ]);

        $this->actingAs($admin)
            ->get('/admin/verifications')
            ->assertOk();
    }

    public function test_admin_can_approve_verification(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'barangay_id' => $this->barangayA->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create(['barangay_id' => $this->barangayA->id])->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_REVIEW_REQUIRED,
        ]);

        $this->actingAs($admin)
            ->from('/admin/verifications')
            ->post("/admin/verifications/{$verification->uuid}/review", [
                'status' => Verification::STATUS_APPROVED,
            ])
            ->assertRedirect('/admin/verifications')
            ->assertSessionHas('success');

        $verification->refresh();
        $this->assertSame(Verification::STATUS_APPROVED, $verification->status);
        $this->assertSame($admin->id, $verification->reviewed_by);
    }

    public function test_admin_can_reject_verification_with_notes(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'barangay_id' => $this->barangayA->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create(['barangay_id' => $this->barangayA->id])->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_REVIEW_REQUIRED,
        ]);

        $this->actingAs($admin)
            ->from('/admin/verifications')
            ->post("/admin/verifications/{$verification->uuid}/review", [
                'status' => Verification::STATUS_REJECTED,
                'notes' => 'Document appears to be tampered.',
            ])
            ->assertRedirect();

        $verification->refresh();
        $this->assertSame(Verification::STATUS_REJECTED, $verification->status);
        $this->assertSame('Document appears to be tampered.', $verification->failure_reason);
    }

    public function test_regular_user_cannot_review_verification(): void
    {
        $user = User::factory()->create(['role' => 'resident', 'barangay_id' => $this->barangayA->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create(['barangay_id' => $this->barangayA->id])->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_REVIEW_REQUIRED,
        ]);

        $this->actingAs($user)
            ->post("/admin/verifications/{$verification->uuid}/review", [
                'status' => Verification::STATUS_APPROVED,
            ])
            ->assertForbidden();
    }

    public function test_admin_can_filter_verifications_by_status(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);

        Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create(['barangay_id' => $this->barangayA->id])->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_APPROVED,
        ]);
        Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create(['barangay_id' => $this->barangayA->id])->id,
            'document_type' => 'national_id',
            'status' => Verification::STATUS_REJECTED,
        ]);

        $this->actingAs($admin)
            ->get('/admin/verifications?status=approved')
            ->assertOk();
    }

    public function test_admin_in_same_barangay_can_review(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'barangay_id' => $this->barangayA->id]);
        $owner = User::factory()->create(['barangay_id' => $this->barangayA->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $owner->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_REVIEW_REQUIRED,
        ]);

        $this->actingAs($admin)
            ->post("/admin/verifications/{$verification->uuid}/review", [
                'status' => Verification::STATUS_APPROVED,
            ])
            ->assertSessionHas('success');
    }

    public function test_admin_in_different_barangay_cannot_review(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'barangay_id' => $this->barangayA->id]);
        $owner = User::factory()->create(['barangay_id' => $this->barangayB->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $owner->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_REVIEW_REQUIRED,
        ]);

        $this->actingAs($admin)
            ->post("/admin/verifications/{$verification->uuid}/review", [
                'status' => Verification::STATUS_APPROVED,
            ])
            ->assertForbidden();
    }
}
