## 1. Database Changes

- [x] 1.1 Add `last_otp_sent_at` column to users table (nullable, datetime, UTC)
- [x] 1.2 Create database migration for the new column

## 2. OTP Throttling Implementation

- [x] 2.1 Update login service to check last_otp_sent_at before sending OTP
- [x] 2.2 Implement 5-day window check logic (compare current UTC time with last_otp_sent_at)
- [x] 2.3 Add logic to return success response when OTP skipped due to throttling
- [x] 2.4 Update last_otp_sent_at timestamp after successful OTP delivery

## 3. Session Duration Update

- [x] 3.1 Update session configuration to 7 days (604800 seconds)
- [x] 3.2 Update session cookie expiry settings
- [x] 3.3 Verify session persists across browser close for 7 days

## 4. Testing

- [x] 4.1 Write unit test for OTP throttling - request within 5 days
- [x] 4.2 Write unit test for OTP throttling - request after 5 days
- [x] 4.3 Write unit test for session expiry after 7 days
- [x] 4.4 Integration test for end-to-end login flow with throttling