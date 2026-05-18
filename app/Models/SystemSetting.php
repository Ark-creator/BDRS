<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    public const EMAIL_VERIFICATION_ENABLED = 'email_verification_enabled';
    public const TWO_FACTOR_GRACE_PERIOD_ENABLED = 'two_factor_grace_period_enabled';
    public const TWO_FACTOR_GRACE_PERIOD_DAYS = 'two_factor_grace_period_days';
    public const DEFAULT_TWO_FACTOR_GRACE_PERIOD = 7;

    protected $fillable = [
        'key',
        'value',
    ];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $value = static::query()->where('key', $key)->value('value');

        return $value ?? $default;
    }

    public static function setValue(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
        );
    }

    public static function boolean(string $key, bool $default = false): bool
    {
        $value = static::getValue($key);

        if ($value === null) {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public static function emailVerificationEnabled(): bool
    {
        return static::boolean(static::EMAIL_VERIFICATION_ENABLED, false);
    }

    public static function twoFactorGracePeriodEnabled(): bool
    {
        return static::boolean(static::TWO_FACTOR_GRACE_PERIOD_ENABLED, false);
    }

    public static function twoFactorGracePeriodDays(): int
    {
        $value = static::getValue(static::TWO_FACTOR_GRACE_PERIOD_DAYS);

        if ($value === null) {
            return static::DEFAULT_TWO_FACTOR_GRACE_PERIOD;
        }

        return (int) $value ?: static::DEFAULT_TWO_FACTOR_GRACE_PERIOD;
    }
}
