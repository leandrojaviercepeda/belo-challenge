# Delta for user-transactions

## ADDED Requirements

### Requirement: Create Money Transfer

The system MUST provide an endpoint to transfer money between two registered users.

#### Scenario: Successful transfer

- GIVEN user A has balance of 100, user B exists, and user A is authenticated
- WHEN user A submits POST /transactions with amount=50, toUserId=userB
- THEN the system MUST create a transaction with status COMPLETED
- AND user A balance MUST be 50
- AND user B balance MUST increase by 50

#### Scenario: Transfer with insufficient balance

- GIVEN user A has balance of 30
- WHEN user A submits POST /transactions with amount=50
- THEN the system MUST return 400 Bad Request
- AND must not create any transaction
- AND both balances MUST remain unchanged

#### Scenario: Transfer to non-existent user

- GIVEN authenticated user A
- WHEN user A submits POST /transactions with non-existent toUserId
- THEN the system MUST return 404 Not Found
- AND must not create any transaction

#### Scenario: Transfer to self

- GIVEN authenticated user A
- WHEN user A submits POST /transactions with toUserId=userA
- THEN the system MUST return 400 Bad Request
- AND must not create any transaction

### Requirement: Get Transaction

The system MUST provide an endpoint to retrieve a transaction by ID.

#### Scenario: Get existing transaction

- GIVEN authenticated user A who owns transaction T
- WHEN user A requests GET /transactions/T-id
- THEN the system MUST return 200 OK
- AND return transaction data (id, amount, fromUserId, toUserId, status, createdAt)

#### Scenario: Get non-existent transaction

- GIVEN authenticated user
- WHEN user requests GET /transactions/non-existent-id
- THEN the system MUST return 404 Not Found

#### Scenario: Get transaction owned by other user

- GIVEN authenticated user A
- WHEN user A requests GET /transactions/owned-by-user-B
- THEN the system MUST return 403 Forbidden
