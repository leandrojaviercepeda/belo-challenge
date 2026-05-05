# Análisis de errores en los tests

## Errores encontrados

### 1. Falta limpieza de estado entre tests

Los tests dependen de que la base de datos tenga datos específicos, pero no hay `beforeEach` para limpiarla. Si los tests corren en orden diferente o hay datos previos, fallan.

### 2. IDs basados en longitud (problema grave)

```typescript
const id = database.users.length + 1;
```

Este enfoque genera IDs duplicados si se elimina un usuario. Por ejemplo:

- Agregar usuario → ID 1
- Agregar usuario → ID 2
- Eliminar usuario con ID 1
- Agregar nuevo usuario → **ID 2 otra vez** (ERROR: conflicto)

### 3. Tests frágililes por dependencia de orden

- Test 2 asume que "Alice" existe (ID 1)
- Test 4 asume que ya hay 1 usuario

Si el test 1 no corre primero, los demás fallan.

---

## Solución propuesta

```typescript
// Agregar antes de cada test
beforeEach(() => {
  database.users.clear(); // o la forma de limpiar tu database
});

// Usar IDs únicos
let userIdCounter = 0;
function addUserToDatabase(name: string): number {
  const id = ++userIdCounter; // o usar UUID
  database.users.add({ id, name });
  return id;
}
```

---

## Resumen

| Error                       | Gravedad |
| --------------------------- | -------- |
| No hay limpieza entre tests | Alta     |
| IDs por length              | Alta     |
| Dependencia de orden        | Media    |
