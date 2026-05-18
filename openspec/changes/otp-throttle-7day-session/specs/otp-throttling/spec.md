## ADDED Requirements

### Requirement: OTP throttling enforcement
The system SHALL prevent sending OTP within 5 days of the last successful OTP delivery to reduce API calls and prevent credit exhaustion.

#### Scenario: OTP request within 5-day window
- **WHEN** user requests OTP for login and last OTP was sent less than 5 days ago
- **THEN** system SHALL skip sending OTP and return success response indicating "OTP already sent"

#### Scenario: OTP request after 5-day window
- **WHEN** user requests OTP for login and last OTP was sent more than 5 days ago (or never)
- **THEN** system SHALL send OTP via configured delivery method (email/SMS) and update last_otp_sent_at timestamp

#### Scenario: First-time OTP request
- **WHEN** user requests OTP and last_otp_sent_at is NULL (never sent OTP before)
- **THEN** system SHALL send OTP and set last_otp_sent_at to current timestamp

### Requirement: OTP timestamp tracking
The system SHALL store the last OTP request timestamp in the user's record to enable throttling calculations.

#### Scenario: Timestamp updated on OTP send
- **WHEN** system successfully sends OTP to user
- **THEN** system SHALL update last_otp_sent_at field with current UTC timestamp