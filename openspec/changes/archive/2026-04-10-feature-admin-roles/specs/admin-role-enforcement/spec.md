## ADDED Requirements

### Requirement: User role field

La entidad User debe tener un campo `role` que acepte únicamente los valores 'user' o 'admin'. El valor por defecto debe ser 'user'.

#### Scenario: New user gets default role

- **WHEN** se crea un nuevo usuario en el sistema
- **THEN** el campo role se establece automáticamente a 'user'

#### Scenario: Admin role assigned manually

- **WHEN** un administrador asigna el rol 'admin' a un usuario
- **THEN** el campo role del usuario se actualiza a 'admin'

### Requirement: JWT includes role in payload

El JWT token generado debe incluir el campo `role` en su payload para permitir validación rápida del lado del servidor sin consultar la base de datos en cada request.

#### Scenario: New token includes role

- **WHEN** un usuario autenticado recibe un nuevo token JWT
- **THEN** el payload del token contiene el campo 'role' con el valor correspondiente al usuario

#### Scenario: Old token without role

- **WHEN** un usuario intenta acceder con un token JWT antiguo (sin campo role en payload)
- **THEN** el RolesGuard deniega el acceso con 403 Forbidden

### Requirement: RolesGuard validation

El RolesGuard debe validar que el usuario tiene el rol requerido antes de permitir acceso al endpoint. Si el usuario no tiene el rol necesario, debe retornar 403 Forbidden.

#### Scenario: Admin accessing admin endpoint

- **WHEN** un usuario con role 'admin' hace request a un endpoint protegido con @Roles('admin')
- **THEN** el RolesGuard permite el acceso

#### Scenario: Regular user accessing admin endpoint

- **WHEN** un usuario con role 'user' hace request a un endpoint protegido con @Roles('admin')
- **THEN** el RolesGuard retorna 403 Forbidden

### Requirement: @Roles decorator

El decorador @Roles() debe permitir especificar qué roles pueden acceder a un endpoint. El decorador debe usar SetMetadata para almacenar el rol requerido.

#### Scenario: Roles decorator applied to endpoint

- **WHEN** un endpoint usa el decorador @Roles('admin')
- **THEN** el RolesGuard puede leer la metadata del rol requerido y validar contra el role del usuario

### Requirement: Admin endpoints protected

Todos los endpoints del AdminController deben requerir rol 'admin' para acceder.

#### Scenario: Admin accesses balance endpoint

- **WHEN** un admin hace request a GET /admin/users/:id/balance
- **THEN** la respuesta retorna el saldo del usuario

#### Scenario: Non-admin denied from balance endpoint

- **WHEN** un usuario regular hace request a GET /admin/users/:id/balance
- **THEN** la respuesta es 403 Forbidden

#### Scenario: Non-admin denied from set-balance endpoint

- **WHEN** un usuario regular hace request a POST /admin/users/:id/balance
- **THEN** la respuesta es 403 Forbidden

### Requirement: Backward compatibility for existing users

Los usuarios existentes en la base de datos deben mantener su acceso. El campo role debe tener un valor por defecto de 'user'.

#### Scenario: Existing user migrates with default role

- **WHEN** se ejecuta la migración que agrega la columna role
- **THEN** todos los usuarios existentes tienen role = 'user'

#### Scenario: Missing role in request.user

- **WHEN** request.user no tiene campo role (token antiguo)
- **THEN** el RolesGuard trata el role como 'user' y denied el acceso a endpoints de admin
