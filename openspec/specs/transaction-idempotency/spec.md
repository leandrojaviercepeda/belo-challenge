# transaction-idempotency Specification

## Purpose

This spec covers the idempotency mechanism for transaction creation to prevent duplicate transactions.

## ADDED Requirements

### Requirement: Idempotent Transaction Creation

The system MUST guarantee that duplicate transactions with the same idempotencyKey are processed only once.

#### Scenario: Duplicate transaction with same idempotencyKey

- GIVEN user A submits a transfer with idempotencyKey=abc123 (first time)
- WHEN user A submits the same transfer again with idempotencyKey=abc123
- THEN the system MUST return the original transaction (not create a duplicate)
- AND return 200 OK (not 201 Created)
- AND both responses MUST have the same transaction ID

#### Scenario: Unique idempotencyKey creates new transaction

- GIVEN user A submits a transfer with idempotencyKey=key1
- WHEN user A submits another transfer with idempotencyKey=key2
- THEN the system MUST create two distinct transactions
- AND return 201 Created for each

#### Scenario: Invalid idempotencyKey format

- GIVEN user A submits a transfer with invalid idempotencyKey (not UUID)
- THEN the system MUST return 400 Bad Request
- AND must not process the transaction

#### Scenario: Missing idempotencyKey

- GIVEN user A submits a transfer without idempotencyKey
- THEN the system MUST auto-generate a unique idempotencyKey
- AND process the transaction normally
