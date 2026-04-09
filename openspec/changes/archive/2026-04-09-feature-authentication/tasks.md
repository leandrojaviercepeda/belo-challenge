# Tasks: feature/authentication

## Phase 1: Dependencies & Configuration

- [x] 1.1 Install npm dependencies: bcrypt, @nestjs/jwt, passport, passport-jwt
- [x] 1.2 Add @types/bcrypt and @types/passport-jwt to devDependencies
- [x] 1.3 Update src/config/env.validation.ts to include JWT_SECRET validation
- [x] 1.4 Add JWT configuration to .env and .env.example (env.validation.ts updated)

## Phase 2: Users Module (Foundation)

- [x] 2.1 Create src/users/user.entity.ts with TypeORM entity
- [x] 2.2 Create src/users/users.module.ts
- [x] 2.3 Create src/users/users.service.ts with CRUD methods
- [x] 2.4 Create src/users/dto/create-user.dto.ts

## Phase 3: Auth Module Core

- [x] 3.1 Create src/auth/auth.module.ts with JWT configuration
- [x] 3.2 Create src/auth/dto/auth-register.dto.ts with validation
- [x] 3.3 Create src/auth/dto/auth-login.dto.ts with validation
- [x] 3.4 Create src/auth/dto/tokens.dto.ts for response
- [x] 3.5 Create src/auth/auth.service.ts with register logic
- [x] 3.6 Create src/auth/auth.service.ts with login logic
- [x] 3.7 Create src/auth/auth.controller.ts with POST /auth/register
- [x] 3.8 Create src/auth/auth.controller.ts with POST /auth/login
- [x] 3.9 Create src/auth/auth.controller.ts with GET /auth/profile

## Phase 4: JWT Strategy & Guards

- [x] 4.1 Create src/auth/strategies/jwt.strategy.ts
- [x] 4.2 Create src/auth/guards/jwt-auth.guard.ts
- [x] 4.3 Apply @UseGuards(JwtAuthGuard) to profile endpoint

## Phase 5: Integration

- [x] 5.1 Import UsersModule in AppModule
- [x] 5.2 Import AuthModule in AppModule
- [x] 5.3 Test POST /auth/register returns 201 with user data (E2E PASSED)
- [x] 5.4 Test POST /auth/login returns tokens (E2E PASSED)
- [x] 5.5 Test GET /auth/profile returns 401 without token (E2E PASSED)
- [x] 5.6 Test GET /auth/profile returns user data with valid token (E2E PASSED)

## Phase 6: Testing

- [x] 6.1 Write unit tests for UsersService
- [x] 6.2 Write unit tests for AuthService.register()
- [x] 6.3 Write unit tests for AuthService.login()
- [x] 6.4 Write unit tests for JwtStrategy
- [x] 6.5 Write unit tests for JwtAuthGuard

## Phase 7: Cleanup & Docs

- [x] 7.1 Update README.md with auth endpoints documentation
- [x] 7.2 Verify all tests pass
- [x] 7.3 Run build to ensure no errors (PASSED)
- [x] 7.4 Configure Swagger UI with Bearer Auth (FIXED)
