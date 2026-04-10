## Context

**Background**: El proyecto tiene un módulo de admin con endpoints críticos (/admin/users/:id/balance) pero cualquier usuario autenticado puede acceder. No existe sistema de control de roles.

**Current State**:

- User entity: `id`, `email`, `password`, `balance` (sin role)
- JWT payload: solo `sub` (userId) y `email` (sin role)
- AdminController usa solo JwtAuthGuard
- No existe RolesGuard ni decorador @Roles

**Constraints**:

- Backward compatibility con usuarios existentes
- Tokens JWT viejos no tienen role → deben re-login
- Debe ser extensible para futuros roles (support, super-admin, etc.)

## Goals / Non-Goals

**Goals:**

- Agregar campo `role` a User entity con valores 'user' | 'admin'
- Incluir role en JWT payload
- Implementar @Roles() decorator + RolesGuard
- Proteger todos los endpoints de AdminController
- Migration no rompe acceso de usuarios existentes

**Non-Goals:**

- UI para gestión de roles
- Permisos granulares (solo 'user' y 'admin')
- Sistema de permisos many-to-many
- Self-service role change

## Decisions

### D1: RBAC con Decorators vs Simple Role Column

- **Decision**: Usar RBAC con @Roles() decorator + RolesGuard
- **Rationale**: Es el estándar de NestJS, extensible, mantenible. Permite agregar más roles fácilmente sin cambios en la estructura.
- **Alternatives considered**:
  - Simple if-check en controller: rápido pero no extensible
  - Full ACL: overkill para solo dos roles

### D2: Role en JWT vs Consultar DB en cada request

- **Decision**: Role en JWT payload
- **Rationale**: Evita query extra a la DB en cada request, mejor performance
- **Alternatives considered**:
  - Consultar DB en RolesGuard: más seguro si role cambia frecuentemente, pero lento

### D3: Default role 'user' para usuarios existentes

- **Decision**: Usar DEFAULT 'user' en columna role
- **Rationale**: Mantiene backward compatibility, usuarios existentes no pierden acceso
- **Alternatives considered**:
  - Nullable + verificar null: más complejo, más puntos de failure
  - Requerir migración manual: más seguro pero más trabajo

### D4: Manejo de tokens antiguos (sin role)

- **Decision**: Denegar acceso - usuario debe re-login
- **Rationale**: Security first - no asumir que usuario sin role en token es admin
- **Alternatives considered**:
  - Fallback a consultar DB: introduce latency,可能的security issue si token fue revocado

## Risks / Trade-offs

**[Risk-01] Breaking change para tokens existentes**
→ **Mitigation**: Tokens viejos no tienen role → 403 Forbidden → usuario re-login automatically

**[Risk-02] Migration de usuarios existentes**
→ **Mitigation**: DEFAULT 'user' en columna → todos existentes quedan con role 'user'

**[Risk-03] Race condition al cambiar role de usuario**
→ **Mitigation**: Si role cambia, nuevo token requiere re-login. Documentar esto.

## Migration Plan

1. **Step 1**: Agregar columna `role` a users con DEFAULT 'user'
2. **Step 2**: Modificar User entity - agregar campo role con enum
3. **Step 3**: Modificar JwtStrategy - agregar role al validate() return
4. **Step 4**: Crear @Roles() decorator y RolesGuard
5. **Step 5**: Aplicar @Roles('admin') a AdminController endpoints
6. **Step 6**: Deploy y verificar

**Rollback**: Si hay problemas, el guard puede removerse temporalmente del controller.

## Open Questions

- **Q1**: ¿Necesitamos un endpoint para asignar roles a usuarios? Por ahora solo manual en DB.
- **Q2**: ¿El primer admin cómo se crea? Seed script o手动 en DB.
