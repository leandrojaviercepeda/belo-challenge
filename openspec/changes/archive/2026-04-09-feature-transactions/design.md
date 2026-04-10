# Design: Transacciones entre usuarios

## Requerimiento de Documentación JSDoc

Todo el código del módulo transactions DEBE estar documentado con comentarios JSDoc en español. Esto es **requerimiento** para esta feature.

### Archivos a documentar:

| Archivo                      | Contenido a documentar                     |
| ---------------------------- | ------------------------------------------ |
| `transaction.entity.ts`      | Cada campo con su propósito y validaciones |
| `transactions.service.ts`    | Métodos públicos con @param y @returns     |
| `transactions.controller.ts` | Cada endpoint con descripción              |
| `dto/*.ts`                   | Cada propiedad con su validación           |

### Ejemplo de formato esperado:

```typescript
/**
 * Entidad que representa una transacción monetaria entre dos usuarios.
 * Almacena el estado de la transferencia y la clave de idempotencia.
 */
@Entity()
export class Transaction {
  /**
   * ID único de la transacción (UUID).
   * Se genera automáticamente al crear.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cantidad a transferir.
   * Debe ser mayor a 0 y tener hasta 2 decimales.
   */
  @Column('decimal', { precision: 20, scale: 2 })
  @IsPositive()
  amount: number;
}
```

## Enfoque Técnico

Implementar un sistema de transferencias monetarias usando NestJS + TypeORM con PostgreSQL. Utilizar bloqueo a nivel de base de datos (SELECT FOR UPDATE), validación de clave de idempotencia y detección configurable de recurrencia para garantizar transferencias atómicas y seguras.

## Decisiones de Arquitectura

### Decisión 1: Almacenamiento de Balance en User Entity

**Elección**: Agregar columna `balance` (DECIMAL) a la entidad User
**Alternativas consideradas**: Entidad Wallet separada, Tabla de historial de balance
**Rationale**: Más simple para MVP - usuarios tienen balance en moneda única. Evita joins adicionales para transferencias básicas.

### Decisión 2: Contador de Recurrencia En-Memoria

**Elección**: Map en memoria `Map<UserId, TransactionCounter>` para seguimiento de recurrencia
**Alternativas consideradas**: Consulta DB con ventana de tiempo, Redis cache
**Rationale**: Simple, rápido, evita carga extra en DB. Con threshold=3 y window=5min, el consumo de memoria es insignificante. No adecuado para escalamiento horizontal (notado en Preguntas Abiertas).

### Decisión 3: Idempotencia a Nivel de Aplicación

**Elección**: Verificar idempotencyKey en servicio antes de crear transacción (SELECT query)
**Alternativas consideradas**: Constraint unique en base de datos
**Rationale**: Permite retornar transacción existente sin error - más amigable. Unique constraint es respaldo.

### Decisión 4: Bloqueo PESSIMISTIC_WRITE para Balance

**Elección**: Usar `lock` en TypeORM repository.findOne() con pessimistic_write
**Alternativas considered**: Bloqueo optimista (columna version), Bloqueos a nivel aplicación
**Rationale**: Garantiza actualizaciones atómicas de balance entre requests concurrentes. Patrón estándar para transacciones financieras.

## Flujo de Datos

```
POST /transactions
        │
        ▼
┌───────────────────┐
│  Validar DTO      │ ──► 400 si es inválido
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Verificar Idemp. │ ──► Retornar existente si existe (200)
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Verificar Recurr.│ ──► 429 si threshold excedido
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Bloquear sender   │ ──► SELECT FOR UPDATE
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Validar balance   │ ──► 400 si insuficiente
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Crear Transacción │
│ + Actualizar bal. │ ──► Atómico (single transaction)
└───────────────────┘
        │
        ▼
    Retornar 201
```

## Cambios de Archivos

| Archivo                                            | Acción    | Descripción                           |
| -------------------------------------------------- | --------- | ------------------------------------- |
| `src/users/user.entity.ts`                         | Modificar | Agregar columna `balance` (DECIMAL)   |
| `src/config/env.validation.ts`                     | Modificar | Agregar vars de config de recurrencia |
| `src/transactions/transaction.entity.ts`           | Crear     | Entidad Transaction                   |
| `src/transactions/transaction-status.enum.ts`      | Crear     | PENDING, COMPLETED, FAILED, REVERSED  |
| `src/transactions/transactions.service.ts`         | Crear     | Lógica principal de transferencia     |
| `src/transactions/transactions.controller.ts`      | Crear     | Endpoints REST                        |
| `src/transactions/transactions.module.ts`          | Crear     | Definición del módulo                 |
| `src/transactions/dto/create-transaction.dto.ts`   | Crear     | DTO de request con validación         |
| `src/transactions/dto/transaction-response.dto.ts` | Crear     | DTO de response                       |
| `src/app.module.ts`                                | Modificar | Importar TransactionsModule           |

## Interfaces / Contratos

### DTOs

```typescript
// create-transaction.dto.ts
export class CreateTransactionDto {
  @IsUUID()
  @IsOptional()
  idempotencyKey?: string;

  @IsUUID()
  toUserId: string;

  @IsPositive()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';
}

// transaction-response.dto.ts
export class TransactionResponseDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: Date;
}
```

### Entity Fields

```typescript
// Transaction entity
- id: UUID (primary)
- fromUserId: UUID (foreign key)
- toUserId: UUID (foreign key)
- amount: Decimal (precision: 20, scale: 2)
- currency: string (default: 'USD')
- status: enum (PENDING, COMPLETED, FAILED, REVERSED)
- idempotencyKey: string (unique)
- createdAt: Date
- updatedAt: Date

// User entity addition
- balance: Decimal (precision: 20, scale: 2, default: 0)
```

### Endpoints

| Método | Path              | Auth | Descripción         |
| ------ | ----------------- | ---- | ------------------- |
| POST   | /transactions     | JWT  | Crear transferencia |
| GET    | /transactions/:id | JWT  | Obtener transacción |

## Estrategia de Testing

| Capa        | Qué Testear                       | Approach                          |
| ----------- | --------------------------------- | --------------------------------- |
| Unit        | Lógica de TransactionService      | Jest - mock repos                 |
| Unit        | Lógica de bloqueo por recurrencia | Jest - test contador              |
| Unit        | Verificación de idempotencia      | Jest - mock findOne               |
| Integration | Flujo completo de transferencia   | Test con DB real (TestContainers) |
| E2E         | Endpoints de API                  | supertest - auth requerida        |

## Migración / Despliegue

1. **Pre-deploy**: Agregar columna `balance` a tabla users (nullable, default 0)
2. **Deploy**: Agregar entidad Transaction (nueva tabla)
3. **Post-deploy**: Backfill usuarios existentes con balance = 0 (si es necesario)

```sql
-- Migration
ALTER TABLE users ADD COLUMN balance DECIMAL(20,2) NOT NULL DEFAULT 0;
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  amount DECIMAL(20,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Preguntas Abiertas

- [ ] **Escalamiento horizontal**: Contador de recurrencia en memoria no funcionará con múltiples instancias. ¿Deberíamos usar Redis, o es aceptable single-instance para MVP?
- [ ] **Manejo de moneda**: Specs no especifican multi-moneda. Asumir moneda única (USD) por ahora - confirmar con producto.
- [ ] **Precisión de balance**: Usar DECIMAL(20,2) - ¿es suficiente para el tamaño máximo de transacción?
- [ ] **Límites de transacción**: ¿Debería haber un monto máximo por transacción? No está en specs - confirmar.
