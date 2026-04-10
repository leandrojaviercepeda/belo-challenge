# Tasks: Transacciones entre usuarios

## Phase 1: Foundation (Infrastructure)

- [x] 1.1 Agregar columna `balance` DECIMAL(20,2) a User entity en `src/users/user.entity.ts`
- [x] 1.2 Crear enum TransactionStatus en `src/transactions/transaction-status.enum.ts`
- [x] 1.3 Crear Transaction entity en `src/transactions/transaction.entity.ts`
- [x] 1.4 Agregar config de recurrencia en `src/config/env.validation.ts`
- [x] 1.5 Documentar Transaction entity con JSDoc en español
- [x] 1.6 Mejorar concurrencia: bloqueo de AMBOS usuarios con pessimistic_write

## Phase 2: Core Implementation

- [x] 2.1 Crear CreateTransactionDto en `src/transactions/dto/create-transaction.dto.ts`
- [x] 2.2 Crear TransactionResponseDto en `src/transactions/dto/transaction-response.dto.ts`
- [x] 2.3 Implementar TransactionsService en `src/transactions/transactions.service.ts`
- [x] 2.4 Documentar DTOs y Service con JSDoc en español
- [x] 2.5 Mover verificación de idempotencia DENTRO de la transacción (evita duplicados)
  - [x] 2.3.1 Método para verificar idempotencyKey
  - [x] 2.3.2 Método para verificar bloqueo por recurrencia
  - [x] 2.3.3 Método para crear transferencia con SELECT FOR UPDATE
  - [x] 2.3.4 Método para obtener transacción por ID
- [x] 2.4 Crear TransactionsController en `src/transactions/transactions.controller.ts`
- [x] 2.5 Documentar TransactionsController con JSDoc en español
  - [x] 2.4.1 POST /transactions endpoint
  - [x] 2.4.2 GET /transactions/:id endpoint
- [x] 2.5 Crear TransactionsModule en `src/transactions/transactions.module.ts`

## Phase 3: Integration

- [x] 3.1 Importar TransactionsModule en `src/app.module.ts`
- [x] 3.2 Verificar que JWT Auth guard proteja los endpoints

## Phase 4: Testing

- [x] 4.1 Tests unitarios para TransactionsService
  - [x] 4.1.1 Test: transferencia exitosa
  - [x] 4.1.2 Test: saldo insuficiente retorna 400
  - [x] 4.1.3 Test: usuario destino no existe retorna 404
  - [x] 4.1.4 Test: transferencia a sí mismo retorna 400
- [x] 4.2 Tests unitarios para idempotencia
  - [x] 4.2.1 Test: duplicate con mismo idempotencyKey retorna original
  - [x] 4.2.2 Test: diferente idempotencyKey crea nueva transacción
- [x] 4.3 Tests unitarios para recurrencia
  - [x] 4.3.1 Test: debajo de threshold permite transacción
  - [x] 4.3.2 Test: sobre threshold bloquea con 429
  - [x] 4.3.3 Test: ventana de tiempo expira permite
- [x] 4.4 Tests de integración (opcional con TestContainers) - Completados post-archivo
- [x] 4.5 Tests E2E para endpoints - Completados (20 tests)

## Phase 5: Seeds

- [x] 5.1 Crear seed con 4 usuarios con balances
- [x] 5.2 Verificar que los seeds funcionan correctamente

## Phase 6: Migration

- [x] 6.1 Ejecutar migración para agregar columna balance
- [x] 6.2 Ejecutar migración para crear tabla transactions

## Phase 7: Verificación Final

- [x] 7.1 Build pasa sin errores
- [x] 7.2 Unit Tests: 48 passing
- [x] 7.3 E2E Tests: 21 passing
- [x] 7.4 JSDoc en español documentado
- [x] 7.5 Concurrencia: idempotency dentro de tx, ambos usuarios bloqueados
