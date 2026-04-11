# Spec: feature-starting-challenge

## 1. Propósito

Implementar consulta y gestión de transacciones pendientes en la fintech Belo.

## 2. API Contract

### 2.1 POST /transactions (REFACTORIZAR)

**Reglas de negocio:**

- Si monto > $50000 → estado = "PENDING"
- Si monto ≤ $50000 → estado = "COMPLETED"
- Si falla el movimiento de fondos → estado = "FAILED"

### 2.2 GET /transactions?userId=...

**Request:**

- Query param: `userId` (UUID, requerido)
- Auth: JWT Bearer token

**Response (200):**

```json
{
  "data": [...],
  "meta": { "total": 10, "page": 1, "limit": 20 }
}
```

**Reglas:**

- El usuario autenticado debe ser el `userId` solicitado (o admin)
- Retorna transacciones donde el usuario es `fromUserId` OR `toUserId`
- Ordenado por `createdAt` DESC

### 2.3 PATCH /transactions/:id/approve

**Reglas:**

- La transacción debe tener `status = "PENDING"`
- Si no está pendiente → 400 error
- Movimiento de fondos atómico con pessimistic lock
- Si origen no tiene saldo suficiente → 400 error
- Si falla el movimiento → estado = "FAILED"

### 2.4 PATCH /transactions/:id/reject

**Reglas:**

- La transacción debe tener `status = "PENDING"`
- Si no está pendiente → 400 error
- NO modifica saldos
- Solo cambia status a "REJECTED"

## 3. Estados de transacción

| Estado    | Descripción                   | Permite approve? | Permite reject? |
| --------- | ----------------------------- | ---------------- | --------------- |
| PENDING   | Esperando verificación manual | ✅ Sí            | ✅ Sí           |
| COMPLETED | Confirmada y procesada        | ❌ No            | ❌ No           |
| REJECTED  | Rechazada por admin           | ❌ No            | ❌ No           |
| FAILED    | Falló por error técnico       | ❌ No            | ❌ No           |

## 4. Edge Cases

| Escenario                         | Respuesta                 |
| --------------------------------- | ------------------------- |
| userId no existe                  | 404 Not Found             |
| Transacción no existe             | 404 Not Found             |
| Approve de transacción no-PENDING | 400 Bad Request           |
| Reject de transacción no-PENDING  | 400 Bad Request           |
| Saldo insuficiente al aprobar     | 400 Bad Request           |
| Error db en approve               | 500 Internal Server Error |

## 5. Validaciones de negocio

- **Atomicidad**: Si falla crédito o débito, rollback completo + estado = FAILED
- **Concurrencia**: Usar pessimistic lock para evitar race conditions
- **Saldos nunca negativos**: Validar antes de debitar
