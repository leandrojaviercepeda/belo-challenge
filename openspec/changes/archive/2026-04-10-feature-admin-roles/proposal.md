## Why

El módulo de administración (`src/admin/admin.controller.ts`) tiene endpoints críticos para gestionar saldos de usuarios, pero actualmente **cualquier usuario autenticado** puede acceder a ellos. Esto es un security gap serio que debe arreglarse inmediatamente para prevenir acceso no autorizado a funciones administrativas.

## What Changes

- Agregar campo `role` a la entidad User (enum: 'user' | 'admin', default 'user')
- Actualizar JWT strategy para incluir el role en el payload del token
- Crear `RolesGuard` y decorador `@Roles()` para control de acceso basado en roles
- Aplicar el guard a todos los endpoints del AdminController
- **BREAKING**: Tokens JWT existentes no tendrán role en payload → usuarios deben re-login

## Capabilities

### New Capabilities

- `admin-role-enforcement`: Sistema de control de acceso basado en roles (RBAC) con decorator @Roles() y RolesGuard para proteger endpoints de administración

### Modified Capabilities

- `authentication`: El JWT payload se modifica para incluir el campo `role` - esto es un cambio en cómo el token se genera, no en el comportamiento del spec existente

## Impact

- **Affected files**:
  - `src/users/user.entity.ts` - agregar columna role
  - `src/auth/strategies/jwt.strategy.ts` - incluir role en JWT payload
  - `src/auth/guards/` - crear RolesGuard y @Roles decorator
  - `src/admin/admin.controller.ts` - aplicar rol de admin
- **Database**: Nueva columna `role` en tabla users con default 'user'
- **Migration**: Usuarios existentes reciben default 'user' - no pierden acceso
