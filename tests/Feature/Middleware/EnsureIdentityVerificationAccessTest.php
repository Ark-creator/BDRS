<?php

namespace Tests\Feature\Middleware;

use App\Models\Barangay;
use App\Models\Municipality;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EnsureIdentityVerificationAccessTest extends TestCase
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

    public function test_owner_can_view_their_verification_status(): void
    {
        $user = User::factory()->create(['barangay_id' => $this->barangayA->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_DRAFT,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertOk();
    }

    public function test_other_user_cannot_view_verification(): void
    {
        $owner = User::factory()->create(['barangay_id' => $this->barangayA->id]);
        $other = User::factory()->create(['barangay_id' => $this->barangayA->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $owner->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_DRAFT,
        ]);

        Sanctum::actingAs($other);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertForbidden();
    }

    public function test_admin_can_view_any_verification(): void
    {
        $owner = User::factory()->create(['barangay_id' => $this->barangayA->id]);
        $admin = User::factory()->create(['role' => 'admin', 'barangay_id' => $this->barangayA->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $owner->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_APPROVED,
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertOk();
    }

    public function test_super_admin_can_view_any_verification(): void
    {
        $owner = User::factory()->create(['barangay_id' => $this->barangayA->id]);
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $owner->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_APPROVED,
        ]);

        Sanctum::actingAs($superAdmin);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertOk();
    }

    public function test_admin_in_different_barangay_cannot_view(): void
    {
        $owner = User::factory()->create(['barangay_id' => $this->barangayA->id]);
        $admin = User::factory()->create(['role' => 'admin', 'barangay_id' => $this->barangayB->id]);
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $owner->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_APPROVED,
        ]);

        Sanctum::actingAs($admin);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertForbidden();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $verification = Verification::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => User::factory()->create(['barangay_id' => $this->barangayA->id])->id,
            'document_type' => 'passport',
            'status' => Verification::STATUS_DRAFT,
        ]);

        $this->getJson("/api/verification/status/{$verification->uuid}")
            ->assertUnauthorized();
    }
}
