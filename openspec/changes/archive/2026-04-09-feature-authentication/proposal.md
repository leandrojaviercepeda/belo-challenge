# Proposal: feature/authentication

## Intent

Implementar sistema de autenticación completo para la API REST del challenge de Belo. Permite registro de usuarios, login con credenciales, y autenticación mediante tokens JWT. Este sistema es prerequisito para las transacciones entre cuentas.

## Scope

### In Scope

- Registro de nuevos usuarios con validación de datos
- Login con email y contraseña
- Generación y validación de tokens JWT (access + refresh)
- Hash de contraseñas con bcrypt
- Middleware de autenticación para endpoints protegidos
- Logout (invalidate refresh token)

### Out of Scope

- Autenticación con proveedores externos (Google, Facebook, etc.)
- Recuperación de contraseña por email
- Verificación de email
- Autenticación de dos factores (2FA)
- Roles y permisos (futuro)

## Capabilities

### New Capabilities

- `user-registration`: Registro de nuevos usuarios con validación de email único y contraseña segura
- `user-login`: Autenticación de usuarios con credenciales y generación de tokens
- `jwt-authentication`: Sistema de tokens JWT para protección de endpoints
- `auth-middleware`: Middleware NestJS para verificar tokens en requests protegidos

### Modified Capabilities

- None

## Approach

1. **Setup de dependencias**: Instalar bcrypt, @nestjs/jwt, passport-jwt
2. **User Entity**: Crear entidad User con campos para auth (email, password hash, timestamps)
3. **Auth Module**: Crear módulo de autenticación con controller, service
4. **JWT Strategy**: Implementar Passport JWT strategy para validación de tokens
5. **Auth Guard**: Crear custom guard para protección de endpoints
6. **Registro endpoint**: POST /auth/register con validación
7. **Login endpoint**: POST /auth/login retorna tokens
8. **Endpoints protegidos**: Ejemplo con health u otro endpoint

## Affected Areas

| Area                     | Impact | Description                      |
| ------------------------ | ------ | -------------------------------- |
| `src/auth/`              | New    | Módulo completo de autenticación |
| `src/users/`             | New    | Entity y servicio de usuarios    |
| `src/common/guards/`     | New    | Auth guard para protección       |
| `src/common/strategies/` | New    | JWT strategy                     |

## Risks

| Risk                 | Likelihood | Mitigation                               |
| -------------------- | ---------- | ---------------------------------------- |
| Exposición de tokens | Medium     | Usar httpOnly cookies para refresh token |
| Password weak        | Low        | Validación minima 8 chars, alphanumeric  |
| JWT expiration       | Low        | Access token 15min, refresh 7 días       |

## Rollback Plan

1. Eliminar directorio src/auth/ completo
2. Eliminar directorio src/users/
3. Eliminar guards y strategies de src/common/
4. Eliminar dependencias de package.json
5. Remover módulo de AppModule

## Dependencies

- bcrypt: Hashing de contraseñas
- @nestjs/jwt: Generación y validación JWT
- passport-jwt: Estrategia de autenticación
- class-validator: Validación de DTOs

## Success Criteria

- [ ] POST /auth/register crea usuario y retorna 201
- [ ] POST /auth/login retorna access y refresh tokens
- [ ] GET /auth/profile retorna datos del usuario autenticado
- [ ] Tokens expiran correctamente (access: 15min, refresh: 7 días)
- [ ] Contraseñas hasheadas en base de datos
- [ ] Tests unitarios para auth service pasan
- [ ] Middleware bloquea requests sin token válido
