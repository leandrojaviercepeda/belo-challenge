# Authentication Specification

## Purpose

This spec covers the complete authentication system including user registration, login with JWT tokens, and middleware for protected endpoints.

## ADDED Requirements

### Requirement: User Registration

The system MUST provide a registration endpoint that creates new users with validated credentials.

#### Scenario: Successful registration

- GIVEN valid email and password
- WHEN user submits POST /auth/register with email and password
- THEN the system MUST create a new user record with hashed password
- AND return 201 Created with user data (excluding password)

#### Scenario: Registration with duplicate email

- GIVEN an email that already exists in the database
- WHEN user submits POST /auth/register with that email
- THEN the system MUST return 400 Bad Request
- AND must not create a duplicate user

#### Scenario: Registration with weak password

- GIVEN a password shorter than 8 characters
- WHEN user submits POST /auth/register with weak password
- THEN the system MUST return 400 Bad Request
- AND must not create the user

#### Scenario: Registration with invalid email

- GIVEN an invalid email format
- WHEN user submits POST /auth/register with invalid email
- THEN the system MUST return 400 Bad Request
- AND must not create the user

### Requirement: User Login

The system MUST provide a login endpoint that authenticates users and returns JWT tokens.

#### Scenario: Successful login

- GIVEN valid email and password
- WHEN user submits POST /auth/login with correct credentials
- THEN the system MUST return 200 OK
- AND return access token and refresh token

#### Scenario: Login with wrong password

- GIVEN valid email but wrong password
- WHEN user submits POST /auth/login with wrong password
- THEN the system MUST return 401 Unauthorized
- AND must not return any tokens

#### Scenario: Login with non-existent user

- GIVEN an email that doesn't exist
- WHEN user submits POST /auth/login
- THEN the system MUST return 401 Unauthorized
- AND must not reveal that email doesn't exist

### Requirement: JWT Token Generation

The system MUST generate valid JWT tokens with appropriate expiration times.

#### Scenario: Access token expiration

- GIVEN a valid access token
- WHEN access token expires (15 minutes)
- THEN the system MUST reject the token
- AND require user to use refresh token

#### Scenario: Refresh token rotation

- GIVEN a valid refresh token
- WHEN user requests new access token
- THEN the system MUST issue new access token
- AND optionally rotate refresh token

### Requirement: JWT Authentication Middleware

The system MUST protect endpoints using JWT authentication.

#### Scenario: Accessing protected endpoint with valid token

- GIVEN a valid access token
- WHEN user makes authenticated request to protected endpoint
- THEN the system MUST allow the request
- AND attach user payload to request

#### Scenario: Accessing protected endpoint without token

- GIVEN no token provided
- WHEN user makes request to protected endpoint
- THEN the system MUST return 401 Unauthorized

#### Scenario: Accessing protected endpoint with expired token

- GIVEN an expired access token
- WHEN user makes request to protected endpoint
- THEN the system MUST return 401 Unauthorized

### Requirement: User Profile

The system MUST provide a protected endpoint to get current user data.

#### Scenario: Get profile with valid token

- GIVEN valid access token
- WHEN user requests GET /auth/profile
- THEN the system MUST return 200 OK
- AND return user data (email, id, createdAt)
