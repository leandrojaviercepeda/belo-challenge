# Design: feature-starting-challenge

## Tareas de implementación

| #   | Tarea                               | Descripción                                                                             |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | **Refactorizar POST /transactions** | Adaptar lógica según monto: >$50000=pending, ≤$50000=completed. Si falla, estado=FAILED |
| 2   | GET /transactions?userId=...        | Listar transacciones del usuario (paginado)                                             |
| 3   | PATCH /transactions/:id/approve     | Aprobar transacción pending (movimiento atómico)                                        |
| 4   | PATCH /transactions/:id/reject      | Rechazar transacción pending (sin modificar saldos)                                     |
| 5   | Tests                               | Unitarios + E2E                                                                         |

---

## Tarea 1: Refactorizar createTransaction()

### Cambio en `src/transactions/transactions.service.ts`:

```typescript
const AMOUNT_THRESHOLD = 50000;
const isLargeAmount = dto.amount > AMOUNT_THRESHOLD;

// Si monto > 50000: estado PENDING, NO debita/credita
// Si monto ≤ 50000: estado COMPLETED, debita/credita
```

---

## Tarea 2: GET /transactions?userId=...

### DTO: GetTransactionsQueryDto

```typescript
class GetTransactionsQueryDto {
  @IsUUID() @IsNotEmpty() userId: string;
  @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 20;
}
```

### Service: findByUserId()

```typescript
async findByUserId(userId: string, page: number, limit: number) {
  const [transactions, total] = await this.transactionRepository.findAndCount({
    where: [{ fromUserId: userId }, { toUserId: userId }],
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return { data: transactions, meta: { total, page, limit } };
}
```

---

## Tarea 3: PATCH /transactions/:id/approve

```typescript
async approve(id: string): Promise<Transaction> {
  return this.dataSource.transaction(async (manager) => {
    const transaction = await manager.findOne(Transaction, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== TransactionStatus.PENDING)
      throw new BadRequestException('Transaction is not pending');

    // Lock usuarios, validar saldo, debitar/creditar, cambiar status a COMPLETED
  });
}
```

---

## Tarea 4: PATCH /transactions/:id/reject

```typescript
async reject(id: string): Promise<Transaction> {
  const transaction = await this.transactionRepository.findOne({ where: { id } });

  if (!transaction) throw new NotFoundException('Transaction not found');
  if (transaction.status !== TransactionStatus.PENDING)
    throw new BadRequestException('Transaction is not pending');

  transaction.status = TransactionStatus.REJECTED;
  return this.transactionRepository.save(transaction);
}
```

---

## Tarea 5: Tests

### Unitarios

- createTransaction >$50000 → status = PENDING
- createTransaction ≤$50000 → status = COMPLETED
- findByUserId retorna transacciones del usuario
- approve cambia status a COMPLETED
- reject cambia status a REJECTED

### E2E

- GET /transactions → 401 sin auth
- PATCH /transactions/:id/approve → 403 sin admin
- PATCH /transactions/:id/approve → 400 si no está pending
- PATCH /transactions/:id/reject → 400 si no está pending
