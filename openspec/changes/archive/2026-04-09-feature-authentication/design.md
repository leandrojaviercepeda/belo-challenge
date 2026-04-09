# Design: feature/authentication

## Technical Approach

Implement authentication system using bcrypt for password hashing, @nestjs/jwt for token generation, and passport-jwt for JWT strategy. Follow NestJS module conventions with separate Users and Auth modules.

## Architecture Decisions

### Decision: JWT Token Strategy

**Choice**: passport-jwt with @nestjs/jwt
**Alternatives considered**: Custom JWT implementation, Firebase Auth, Auth0
**Rationale**: Native NestJS integration, well-tested, supports both access and refresh tokens.

### Decision: Password Hashing

**Choice**: bcrypt with salt rounds 10
**Alternatives considered**: scrypt, Argon2, PBKDF2
**Rationale**: Industry standard, widely supported, configurable cost factor.

### Decision: JWT Token Storage

**Choice**: Access token in memory, refresh token in httpOnly cookie
**Alternatives considered**: Both in localStorage, both in cookies
**Rationale**: XSS protection for refresh token, httpOnly prevents JavaScript access.

### Decision: Access Token Expiration

**Choice**: 15 minutes for access, 7 days for refresh
**Alternatives considered**: 30min/30days, 1hr/7days
**Rationale**: Balance between security (short access) and UX (reasonable refresh interval).

### Decision: User Entity Design

**Choice**: Separate UsersModule with TypeORM entity
**Alternatives considered**: Inline user in AuthModule
**Rationale**: Separation of concerns, reusable for future features like user profile.

## Data Flow

```
Registration:
User (email, password) → AuthController → AuthService → UsersRepository → PostgreSQL

Login:
User (email, password) → AuthController → AuthService → UsersRepository → bcrypt.compare → JWT sign → Response

Protected Request:
Request + JWT → JwtStrategy → validate() → AuthGuard → Controller
```

## File Changes

| File                                  | Action | Description                                     |
| ------------------------------------- | ------ | ----------------------------------------------- |
| `src/users/user.entity.ts`            | Create | TypeORM entity for users                        |
| `src/users/users.module.ts`           | Create | Users module                                    |
| `src/users/users.service.ts`          | Create | User CRUD operations                            |
| `src/auth/auth.module.ts`             | Create | Auth module with JWT config                     |
| `src/auth/auth.controller.ts`         | Create | REST endpoints for auth                         |
| `src/auth/auth.service.ts`            | Create | Login, register, token logic                    |
| `src/auth/dto/auth-register.dto.ts`   | Create | Register DTO with validation                    |
| `src/auth/dto/auth-login.dto.ts`      | Create | Login DTO with validation                       |
| `src/auth/dto/tokens.dto.ts`          | Create | Token response DTO                              |
| `src/auth/strategies/jwt.strategy.ts` | Create | Passport JWT strategy                           |
| `src/auth/guards/jwt-auth.guard.ts`   | Create | Auth guard for protected routes                 |
| `src/config/env.validation.ts`        | Modify | Add JWT_SECRET validation                       |
| `package.json`                        | Modify | Add bcrypt, @nestjs/jwt, passport, passport-jwt |

## Interfaces / Contracts

```typescript
// User Entity
interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Response
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

// JWT Payload
interface JwtPayload {
  sub: string; // user id
  email: string;
}
```

## Testing Strategy

| Layer       | What to Test                            | Approach                        |
| ----------- | --------------------------------------- | ------------------------------- |
| Unit        | AuthService (register, login, validate) | Jest with mock UsersRepository  |
| Unit        | JwtStrategy                             | Jest with mock JwtService       |
| Integration | Auth endpoints                          | Jest with TestClient            |
| Unit        | Guards                                  | Jest with mock ExecutionContext |

## Migration / Rollout

No migration required. New tables created automatically with TypeORM synchronize.

## Open Questions

- [ ] Should we add rate limiting to prevent brute force? (defer to future)
- [ ] Should refresh tokens be stored in DB? (simplified: not for now)

## Dependencies to Add

```json
"dependencies": {
  "bcrypt": "^5.1.1",
  "@nestjs/jwt": "^11.0.0",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1"
}
```
