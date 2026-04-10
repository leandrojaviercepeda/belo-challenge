## Why

The Docker setup wasn't working correctly: containers couldn't communicate, the app wasn't accessible from outside the container, and the build context was bloated with unnecessary files.

## What Changes

- Created single Dockerfile for development (Node 20) with hot reload
- Simplified docker-compose.yml with proper service configuration
- Added .dockerignore to exclude unnecessary files from build context
- Updated main.ts to listen on 0.0.0.0 for container accessibility

## Capabilities

### New Capabilities

- `docker-setup`: Docker development environment setup

### Modified Capabilities

- None

## Impact

- **Files affected**: Dockerfile, docker-compose.yml, .dockerignore, main.ts
- **Running locally**: `docker-compose up` starts both PostgreSQL and app
- **Ports**: 3000 (app), 5432 (postgres)
