## Why

Currently, every login attempt sends an OTP via email or SMS, causing excessive API calls to email services and SMS providers, consuming credits and hitting rate limits. Additionally, the current session timeout is too short, requiring frequent re-authentication. Implementing OTP throttling and extending session duration will reduce API costs and improve user experience.

## What Changes

- Add OTP request throttling to prevent sending OTP within 5 days of the last successful OTP delivery
- Extend user session timeout from current value to 7 days
- Track OTP request timestamps per user to enforce throttling rules

## Capabilities

### New Capabilities
- `otp-throttling`: Implement 5-day cache for OTP requests - skip sending if OTP was already sent within 5 days
- `session-duration`: Extend session timeout to 7 days

### Modified Capabilities
- `user-auth`: Modify session persistence to 7 days (currently shorter)

## Impact

- Authentication service - add OTP throttling logic and session configuration
- User login flow - add check for last OTP request timestamp before sending new OTP
- Session management - update session cookie/expiry configuration to 7 days