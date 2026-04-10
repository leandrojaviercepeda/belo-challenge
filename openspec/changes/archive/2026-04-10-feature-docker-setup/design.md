## Context

**Background**: The Docker setup was broken - containers couldn't communicate and the app wasn't accessible externally.

**Current State**:

- Single Dockerfile (Node 20)
- docker-compose.yml with app + postgres services
- .dockerignore for clean builds

**Constraints**:

- Development environment only
- Must work on localhost

## Goals / Non-Goals

**Goals:**

- Docker Compose starts both services
- App accessible on localhost:3000
- Hot reload for development
- Database persists between runs

**Non-Goals:**

- Production deployment (not this change)
- CI/CD pipelines

## Decisions

### D1: Node Version

- **Decision**: Use Node 20 (latest LTS)
- **Rationale**: NestJS v11 requires Node >= 20 for crypto.randomUUID()

### D2: Dockerfile Location

- **Decision**: Single Dockerfile at root
- **Rationale**: Simpler, docker-compose uses "Dockerfile" by default

### D3: Service Names

- **Decision**: Use "postgres" for database service name
- **Rationale**: Docker DNS resolves service name to container IP

## Migration Plan

1. Remove old Dockerfile (if exists)
2. Use new Dockerfile (Node 20)
3. Run `docker-compose up --build`

## Open Questions

- **Q**: Should we keep the old Dockerfile for production?
- **A**: No, this change is for development only
