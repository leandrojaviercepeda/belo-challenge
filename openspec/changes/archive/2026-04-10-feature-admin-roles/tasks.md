## 1. Database & Entity Changes

- [x] 1.1 Create migration to add `role` column to users table with DEFAULT 'user' (TypeORM sync: true)
- [x] 1.2 Add `UserRole` enum to src/users/user.entity.ts (values: 'user' | 'admin')
- [x] 1.3 Add `role` field to User entity with default 'user'
- [x] 1.4 Run migration and verify column exists (auto-sync enabled)

## 2. JWT Strategy Updates

- [x] 2.1 Update JwtPayload interface to include role field
- [x] 2.2 Modify JwtStrategy.validate() to return { id, email, role } from user
- [x] 2.3 Update auth.service.ts to include role when generating JWT

## 3. RolesGuard Implementation

- [x] 3.1 Create src/auth/guards/roles.guard.ts with RolesGuard class
- [x] 3.2 Implement canActivate() to read @Roles metadata and validate user.role
- [x] 3.3 Handle edge case when user.role is undefined (treat as 'user')

## 4. @Roles Decorator

- [x] 4.1 Create src/auth/decorators/roles.decorator.ts
- [x] 4.2 Implement @Roles() decorator using SetMetadata
- [x] 4.3 Export RolesGuard and @Roles for easy import

## 5. Admin Controller Protection

- [x] 5.1 Import RolesGuard and @Roles in admin.controller.ts
- [x] 5.2 Apply @UseGuards(RolesGuard) at controller level
- [x] 5.3 Add @Roles('admin') to GET /users/:id/balance endpoint
- [x] 5.4 Add @Roles('admin') to POST /users/:id/balance endpoint

## 6. Verification & Testing

- [x] 6.1 Create seed script with admin role (seed-users.ts updated)
- [x] 6.2 Test: Admin can access /admin/users/:id/balance (should return 200)
- [x] 6.3 Test: Regular user can access /admin/users/:id/balance (should return 403)
- [x] 6.4 Test: User with old token (no role) accessing admin endpoint (should return 403)

## 7. Additional Feature (Discovered during implementation)

- [x] 7.1 Add GET /admin/users endpoint to list all users
