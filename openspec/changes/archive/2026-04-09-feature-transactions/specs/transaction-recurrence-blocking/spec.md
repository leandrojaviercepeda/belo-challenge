# Delta for transaction-recurrence-blocking

## ADDED Requirements

### Requirement: Recurrence Fraud Detection

The system MUST block transactions when a user exceeds the configured threshold of transactions within the time window.

#### Scenario: Transactions below threshold

- GIVEN user A has made 2 transactions in the last 5 minutes
- WHEN user A submits a new transfer
- THEN the system MUST allow the transaction
- AND process it normally

#### Scenario: Transactions exceed threshold - blocked

- GIVEN user A has made 3 transactions in the last 5 minutes (threshold=3)
- WHEN user A submits a new transfer
- THEN the system MUST return 429 Too Many Requests
- AND must not create the transaction
- AND the response MUST include reason: "recurrence blocked"

#### Scenario: Window reset after time expires

- GIVEN user A made 3 transactions 6 minutes ago (window=5 min)
- WHEN user A submits a new transfer
- THEN the system MUST allow the transaction
- AND process it normally

#### Scenario: Different users have independent counters

- GIVEN user A has 3 transactions in last 5 minutes
- WHEN user B (who has 0 transactions) submits a transfer
- THEN the system MUST allow the transaction
- AND must not block based on user A's count

#### Scenario: Configuration via environment variables

- GIVEN TRANSACTION_RECURRENCE_WINDOW_MINUTES=5 and TRANSACTION_RECURRENCE_THRESHOLD=3
- WHEN the system evaluates recurrence
- THEN it MUST use these values to determine blocking
