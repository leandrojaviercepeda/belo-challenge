# Propuesta: Transacciones entre usuarios

## Intención

Implementar un sistema de transacciones monetarias entre usuarios registrados, considerando aspectos críticos como:

- **Idempotencia**: Garantizar que transacciones duplicadas con la misma clave de idempotencia solo se procesen una vez
- **Unicidad**: Validar que cada transacción sea única y rastreable
- **Bloqueo por recurrencia fraudulenta**: Detectar y bloquear patrones de comportamiento sospechoso (múltiples transacciones en ventana de tiempo corta)

El sistema debe permitir transferencias entre cuentas con validación de saldo, registro inmutable de transacciones y detección de patrones de comportamiento fraudulento.

## Alcance

### Incluido

- Entity Transaction con campos: id, fromUserId, toUserId, amount, currency, status, idempotencyKey, createdAt, updatedAt
- Endpoints REST para crear y consultar transacciones
- Validación de saldo suficiente antes de debitar
- Generación de idempotencyKey para evitar duplicados
- Control de concurrencia con transacciones de base de datos
- Sistema de estados: PENDING, COMPLETED, FAILED, REVERSED
- Contador de recurrencia por usuario con threshold configurable

### Excluido

- Integración con pasarela de pagos externa
- Notificaciones push/email al usuario
- Dashboard administrativo
- Historial completo de transacciones (futura feature)
- JSDoc de otros módulos (otro ticket)

## Documentación JSDoc

Se debe documentar TODO el código del módulo transactions con comentarios JSDoc en español:

- **Entity**: Descripción de campos, relaciones y validaciones
- **Service**: Métodos públicos con @param y @returns
- **Controller**: Endpoints con descripción de cada operación
- **DTOs**: Descripción de cada campo y validaciones

Ejemplo de formato:

```typescript
/**
 * Servicio para gestionar transacciones monetarias entre usuarios.
 * Maneja la idempotencia, validación de saldo y bloqueo por recurrencia.
 */
@Service()
export class TransactionsService {
  /**
   * Crea una nueva transacción entre dos usuarios.
   * @param fromUserId - ID del usuario que envía
   * @param createTransactionDto - Datos de la transacción
   * @returns Transacción creada o error соответствующий
   */
  async create(...) { }
}

## Capacidades

### Nuevas Capacidades

- `user-transactions`: Transferencias monetarias entre usuarios registrados con validación de saldo
- `transaction-idempotency`: Garantía de que transacciones duplicadas con mismo idempotencyKey solo se procesan una vez
- `transaction-recurrence-blocking`: Detección y bloqueo de patrones de recurrencia sospechosa

### Capacidades Modificadas

- Ninguna — es una funcionalidad completamente nueva

## Enfoque Técnico

Usar TypeORM con transacciones de base de datos para garantizar atomicidad. Implementar un servicio TransactionService que:

1. Valide el idempotencyKey antes de procesar (verificar si ya existe)
2. Bloquee la cuenta origen (SELECT FOR UPDATE)
3. Verifique saldo suficiente
4. Cree el registro de transacción con estado PENDING
5. Actualice balances de ambas cuentas atómicamente
6. Actualice estado a COMPLETED o FAILED según el resultado
7. Maneje estados con máquina de estados simple

Para recurrencia: mantener un contador de transacciones recientes por usuario en ventana de tiempo configurable y bloquear si supera el threshold definido.

## Áreas Afectadas

| Área                       | Impacto    | Descripción                                              |
| -------------------------- | ---------- | -------------------------------------------------------- |
| `src/transactions/`        | Nuevo      | Módulo completo: entity, service, controller, DTOs       |
| `src/users/user.entity.ts` | Modificado | Agregar campo balance y método para bloquear usuario     |
| `src/app.module.ts`        | Modificado | Importar TransactionsModule                              |
| `src/config/`              | Modificado | Agregar variables de entorno para límites de recurrencia |

## Riesgos

| Riesgo                                        | Probabilidad | Mitigación                                           |
| --------------------------------------------- | ------------ | ---------------------------------------------------- |
| Race condition en transferencias concurrentes | Media        | Usar SELECT FOR UPDATE y transacciones.atomic()      |
| Clave de idempotencia no única                | Baja         | Validar formato UUID en DTO + constraint DB única    |
| Bloqueo excesivo por recurrencia              | Media        | Threshold configurable, whitelist para casos válidos |

## Plan de Rollback

1. Revertir migración de transacciones
2. Eliminar TransactionsModule de AppModule
3. Eliminar directorio src/transactions/
4. Remover columnas relacionadas de users si se agregaron

## Dependencias

- Users module existente (requiere usuario autenticado)
- Database PostgreSQL con soporte a transacciones

## Criterios de Éxito

- [x] POST /transactions crear transferencia con validaciones pasando
- [x] GET /transactions/:id consultar transacción existente
- [x] Transacciones duplicadas con mismo idempotencyKey retornan la original (no crean duplicado)
- [x] Transferencia con saldo insuficiente retorna 400
- [x] Múltiples transacciones en < 5 min bloqueadas (configurable)
- [x] Tests unitarios y E2E pasando
```
