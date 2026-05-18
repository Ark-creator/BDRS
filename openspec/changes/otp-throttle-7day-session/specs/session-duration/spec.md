## ADDED Requirements

### Requirement: Session duration extension
The system SHALL maintain user authentication sessions for 7 days to reduce frequency of re-authentication.

#### Scenario: Session created on successful login
- **WHEN** user successfully authenticates (OTP verified)
- **THEN** system SHALL create session with 7-day (604800 seconds) expiry from login time

#### Scenario: Session persists across browser close
- **WHEN** user closes browser and returns within 7 days
- **THEN** system SHALL recognize existing session and not require re-authentication

#### Scenario: Session expires after 7 days
- **WHEN** user returns after 7 days from session creation
- **THEN** system SHALL treat session as expired and require full re-authentication