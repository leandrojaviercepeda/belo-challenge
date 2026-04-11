# Proposal: feature-starting-challenge

## 1. Intent

**¿Por qué hacemos esto?**

Implementar la funcionalidad de consulta y gestión de transacciones pendientes en la fintech Belo:

- **GET /transactions?userId=...**: Los usuarios necesitan ver su historial de transacciones (enviadas y recibidas)
- **PATCH /transactions/:id/approve**: Permitir aprobación manual de transacciones pendientes (> $50000)
- **PATCH /transactions/:id/reject**: Permitir rechazo de transacciones pendientes sin afectar saldos

**Usuario objetivo**: Usuarios de la fintech que necesitan visibilidad de sus transacciones y admins que deben aprobar transacciones grandes.

## 2. Scope

### Dentro del scope

- Endpoint GET /transactions con filtro por userId
- PATCH /transactions/:id/approve con validación de estado "PENDING" y movimiento atómico
- PATCH /transactions/:id/reject con validación de estado "PENDING" sin modificar saldos
- Refactorizar POST /transactions según monto
- Tests unitarios y e2e

### Fuera del scope

- Dashboard admin separado
- Notificaciones
- Exportación CSV/PDF

## 3. Approach

### Arquitectura

- TransactionsController: nuevos endpoints GET, PATCH approve, PATCH reject
- TransactionsService: lógica de listado, approve (atomic), reject
- DTOs con class-validator

### Patrones

- Pessimistic locking para approve
- Transacciones TypeORM para atomicidad

## 4. Risks

| Risk                    | Mitigation                              |
| ----------------------- | --------------------------------------- |
| Concurrencia en approve | Usar pessimistic write lock             |
| Race conditions         | Validar estado dentro de la transacción |

## 5. Success Criteria

- [ ] GET /transactions?userId=... retorna lista paginada
- [ ] POST /transactions con monto > $50000 → PENDING
- [ ] POST /transactions con monto ≤ $50000 → COMPLETED
- [ ] PATCH approve mueve fondos solo si PENDING
- [ ] PATCH reject cambia estado sin modificar saldos
- [ ] Todos los tests pasan
