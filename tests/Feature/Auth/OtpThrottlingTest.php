<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\TwoFactorCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OtpThrottlingTest extends TestCase
{
    use RefreshDatabase;

    public function test_otp_is_sent_on_first_login_when_2fa_enabled(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_method' => 'email',
            'last_otp_sent_at' => null,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        Notification::assertSentTo($user, TwoFactorCode::class);

        $user->refresh();
        $this->assertNotNull($user->last_otp_sent_at);

        $response->assertRedirect(route('two_factor.prompt'));
    }

    public function test_otp_is_not_sent_within_5_day_throttle_window(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_method' => 'email',
            'last_otp_sent_at' => now()->subDays(3),
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        Notification::assertNotSentTo($user, TwoFactorCode::class);

        $response->assertRedirect(route('two_factor.prompt'));
    }

    public function test_otp_is_sent_after_5_day_throttle_window_expires(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_method' => 'email',
            'last_otp_sent_at' => now()->subDays(6),
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        Notification::assertSentTo($user, TwoFactorCode::class);

        $user->refresh();
        $this->assertNotNull($user->last_otp_sent_at);
        $this->assertTrue($user->last_otp_sent_at->gt(now()->subDays(1)));
    }

    public function test_otp_resend_is_blocked_within_5_day_throttle_window(): void
    {
        $user = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_method' => 'email',
            'last_otp_sent_at' => now()->subDays(2),
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $userId = $user->id;
        $this->withSession(['two_factor_user_id' => $userId]);

        $response = $this->post('/two-factor-challenge/resend', [
            'method' => 'email',
        ]);

        $response->assertSessionHasErrors(['two_factor_code']);
    }

    public function test_session_lifetime_is_set_to_7_days(): void
    {
        $this->assertEquals(10080, config('session.lifetime'));
    }
}
