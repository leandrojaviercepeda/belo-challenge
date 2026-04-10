## ADDED Requirements

### Requirement: Docker Development Environment

The Docker setup must allow running the application locally with PostgreSQL.

#### Scenario: Running with docker-compose

- **WHEN** running `docker-compose up` in the project directory
- **THEN** both PostgreSQL and the NestJS app start together

### Requirement: App Accessibility

The app must be accessible from outside the container.

#### Scenario: Accessing from browser

- **WHEN** accessing http://localhost:3000 from a browser
- **THEN** the health endpoint responds with status: "ok"

### Requirement: Database Connection

The app must connect to PostgreSQL running in Docker.

#### Scenario: Database connected

- **WHEN** the app starts with docker-compose
- **THEN** the health endpoint shows database: "connected"

### Requirement: Hot Reload

Changes in source code should be reflected without rebuilding the container.

#### Scenario: Code changes reflect immediately

- **WHEN** modifying a TypeScript file in src/
- **THEN** the app reloads automatically (NestJS watch mode)
