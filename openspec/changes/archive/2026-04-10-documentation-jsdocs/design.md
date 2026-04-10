## Context

**Background**: El proyecto tiene cobertura inconsistente de JSDoc. Algunos archivos tienen docs en español, pero auth, errors, entities no tienen ninguna.

**Current State**:

- @nestjs/swagger para docs de API externa
- tsconfig.json tiene removeComments: true (JSDoc solo para interno)
- Pattern: Español, algunos @param/@returns

**Constraints**:

- Debe estar en español para consistencia con docs existentes
- No hay breaking changes (solo documentación)

## Goals / Non-Goals

**Goals:**

- Agregar JSDoc a módulos prioritarios: auth, errors, entities, config
- Estandarizar en lenguaje español
- Requerir @param/@returns en todos los métodos públicos

**Non-Goals:**

- Cobertura completa de todos los archivos
- Swagger documentation (ya existe)
- Markdown guides

## Decisions

### D1: Language — Español

- **Rationale**: Consistencia con la documentación existente del proyecto

### D2: Priority Modules — Auth, Errors, Entities

- **Rationale**: Mayor valor, más usados por desarrolladores

### D3: Tag Requirements — @param + @returns

- **Rationale**: Autocompletado de IDE, mejor DX

## Risk Assessment

- **Risk**: Consumo de tiempo → **Mitigation**: Enfocarse solo en módulos prioritarios
- **Risk**: Seguimiento inconsistente → **Mitigation**: Documentar el patrón para futuras contribuciones
