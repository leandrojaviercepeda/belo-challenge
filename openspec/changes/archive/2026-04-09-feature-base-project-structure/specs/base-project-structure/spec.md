# Delta for base-project-structure

## ADDED Requirements

### Requirement: Base Project Setup

The system MUST provide a complete NestJS project structure with all necessary configurations for developing a REST API that handles account balance transactions.

#### Scenario: Project initialization

- GIVEN a new Node.js project with NestJS CLI
- WHEN the base project structure is created with dependencies
- THEN the project MUST have package.json with NestJS, TypeORM, Fastify, Swagger, and Jest

#### Scenario: Database configuration

- GIVEN PostgreSQL as the target database
- WHEN TypeORM is configured with async options
- THEN the system MUST load database credentials from environment variables and validate them

#### Scenario: Environment validation

- GIVEN .env file with required variables
- WHEN the application starts
- THEN all environment variables MUST be validated using class-validator and fail fast if invalid

#### Scenario: Fastify HTTP server

- GIVEN NestJS with Fastify adapter
- WHEN the server starts
- THEN the system MUST use Fastify as the underlying HTTP server for better performance

#### Scenario: Swagger documentation

- GIVEN API documentation requirements
- WHEN Swagger is configured
- THEN the system MUST expose Swagger UI at /docs endpoint

#### Scenario: Health check endpoint

- GIVEN service health monitoring requirements
- WHEN the health module is loaded
- THEN the system MUST provide a /health endpoint returning service status

### Requirement: Docker Environment

The system MUST provide containerized development and production environments.

#### Scenario: Local development with Docker

- GIVEN Docker and Docker Compose installed
- WHEN docker-compose up is executed
- THEN the system MUST start PostgreSQL and the NestJS application in isolated containers

#### Scenario: Production build

- GIVEN production deployment requirements
- WHEN Dockerfile build is executed
- THEN the system MUST create a multi-stage build with optimized production image

### Requirement: Testing Suite

The system MUST provide a working test suite with Jest.

#### Scenario: Unit tests execution

- GIVEN Jest configuration
- WHEN npm test is executed
- THEN the system MUST run all spec files and report results

#### Scenario: Test coverage

- GIVEN test files in the project
- WHEN tests are run
- THEN unit tests for env validation and health module MUST pass

## Summary

This delta spec captures the requirements for the base project structure implementation including NestJS setup, database configuration, environment validation, HTTP server, documentation, containerization, and testing infrastructure.
