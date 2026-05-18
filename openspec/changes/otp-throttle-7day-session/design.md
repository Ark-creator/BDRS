## Context

Currently, the login system sends an OTP via email or SMS on every authentication attempt. This creates two issues:
1. Excessive API calls to email services and SMS providers, consuming credits and hitting rate limits
2. Short session timeout requiring frequent re-authentication

The goal is to implement OTP throttling (5-day cache) and extend session duration to 7 days.

## Goals / Non-Goals

**Goals:**
- Implement 5-day OTP throttling to prevent duplicate OTP requests
- Extend user session timeout to 7 days
- Track OTP request timestamps per user to enforce throttling rules

**Non-Goals:**
- Changing the OTP delivery method (email/SMS remains the same)
- Adding new authentication factors
- Modifying the OTP generation algorithm

## Decisions

### OTP Throttling Storage
**Decision:** Store last OTP request timestamp in user database record.

**Rationale:** Using existing user table avoids adding new data stores. Timestamp can be added as a nullable column (`last_otp_sent_at`).

**Alternative:** Redis caching - rejected as it adds infrastructure complexity for simple requirement.

### Session Duration
**Decision:** Update session configuration to 7 days (604800 seconds).

**Rationale:** Standard cookie-based session with 7-day expiry aligns with throttling period.

**Alternative:** JWT tokens - rejected as current system uses session cookies.

### Throttling Check Logic
**Decision:** Check last OTP timestamp before sending new OTP. If less than 5 days, skip sending and return success message indicating OTP already sent.

**Rationale:** User experience remains smooth - they see success without waiting for OTP delivery.

## Risks / Trade-offs

- [Risk] User loses phone/email access - can't receive new OTP for 5 days → [Mitigation] Provide admin bypass or support ticket flow for account recovery
- [Risk] Session hijacking with 7-day expiry → [Mitigation] Implement device tracking or re-auth for sensitive actions
- [Risk] Clock skew on server affecting 5-day calculation → [Mitigation] Use UTC for all timestamp comparisons

## Migration Plan

1. Add `last_otp_sent_at` column to users table (nullable, datetime)
2. Update login service to check timestamp before sending OTP
3. Update session configuration to 7 days
4. Deploy in single release (no rollback needed - backward compatible)