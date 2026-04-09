# Design: base-project-structure

## Technical Approach

Implement a NestJS backend with Fastify adapter, TypeORM for PostgreSQL, and Swagger documentation. The architecture follows NestJS conventions with module-based organization and async configuration for database and environment variables.

## Architecture Decisions

### Decision: Fastify over Express

**Choice**: @nestjs/platform-fastify
**Alternatives considered**: Express (default), native http
**Rationale**: Fastify provides better performance (2-3x faster) with lower memory overhead, matching the proposal's focus on efficient transaction handling.

### Decision: TypeORM with Async Configuration

**Choice**: TypeORMModule.forRootAsync with ConfigService injection
**Alternatives considered**: Synchronous config, ConfigModule.forRoot
**Rationale**: Allows environment variable validation BEFORE database connection, ensuring fail-fast behavior if config is invalid.

### Decision: Environment Validation with class-validator

**Choice**: Custom validate function using class-validator
**Alternatives considered**: Joi, zod, manual validation
**Rationale**: Native NestJS pattern, integrates with ValidationPipe, type-safe, minimal dependencies.

### Decision: Swagger with DocumentBuilder

**Choice**: @nestjs/swagger with programmatic config
**Alternatives considered**: Manual OpenAPI spec, decorators-only
**Rationale**: Programmatic config allows dynamic API info, follows NestJS conventions, automatic Swagger UI at /docs.

### Decision: Multi-stage Dockerfile

**Choice**: Build stage (dependencies + build) + Production stage (only node_modules + dist)
**Alternatives considered**: Single-stage, multi-platform
**Rationale**: Production image minimization, security (no dev tools), faster deployments.

## Data Flow

```
Request → Fastify Adapter → NestJS Pipeline → Controller → Service → Repository → PostgreSQL
                                    ↓
                            ValidationPipe (whitelist)
                                    ↓
                            Swagger Middleware → /docs
```

## File Changes

| File                                | Action | Description                                                     |
| ----------------------------------- | ------ | --------------------------------------------------------------- |
| `src/main.ts`                       | Create | Entry point with Fastify adapter, Swagger setup, ValidationPipe |
| `src/app.module.ts`                 | Create | Root module with ConfigModule, TypeORM async, HealthModule      |
| `src/config/env.validation.ts`      | Create | Environment variable validation using class-validator           |
| `src/config/database.config.ts`     | Create | TypeORM configuration factory                                   |
| `src/health/health.module.ts`       | Create | Health check module                                             |
| `src/health/health.controller.ts`   | Create | Health endpoint controller                                      |
| `src/health/health.service.ts`      | Create | Health check business logic                                     |
| `src/common/errors/error.base.ts`   | Create | Base error class                                                |
| `src/common/errors/error.filter.ts` | Create | Global exception filter                                         |
| `docker-compose.yml`                | Create | PostgreSQL + app services                                       |
| `Dockerfile`                        | Create | Multi-stage production build                                    |
| `.env`, `.env.example`              | Create | Environment configuration                                       |

## Interfaces / Contracts

```typescript
// Environment validation
interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USER: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
}

// Health response
interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
}
```

## Testing Strategy

| Layer       | What to Test                  | Approach                     |
| ----------- | ----------------------------- | ---------------------------- |
| Unit        | Env validation, HealthService | Jest with mock ConfigService |
| Integration | Health endpoint               | Jest with TestClient         |
| E2E         | Full app startup              | Manual with Docker           |

## Migration / Rollout

No migration required. This is a new project setup.

## Open Questions

- [ ] None - all decisions resolved during implementation

## Implementation Notes

- Health endpoint responds at GET /health
- Swagger UI available at GET /docs
- PostgreSQL connection tested via TypeORM synchronize
- All 14 unit tests passing
