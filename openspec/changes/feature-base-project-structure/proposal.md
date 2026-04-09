# Proposal: feature/base-project-structure

## Intent

Crear la estructura base del proyecto NestJS con todas las configuraciones iniciales necesarias para desarrollar una API REST que maneje transacciones de movimientos entre cuentas. El objetivo es tener un proyecto funcional con las mejores prácticas de desarrollo.

## Scope

### In Scope
- Setup de proyecto NestJS con CLI + estructura personalizada
- Configuración de package manager npm
- Base de datos PostgreSQL con TypeORM
- Health check endpoint
- Testing con Jest (unit + e2e)
- Fastify como servidor HTTP
- Swagger UI para documentación
- Docker y docker-compose para entorno local
- Configuración con @nestjs/config + class-validator

### Out of Scope
- Funcionalidades de negocio (transacciones, cuentas)
- Autenticación y autorización
- Despliegue a producción
- CI/CD

## Capabilities

### New Capabilities
- `base-project-setup`: Configuración inicial del proyecto NestJS con todas las dependencias y estructura base

### Modified Capabilities
- None

## Approach

1. **Setup inicial**: Ejecutar `nest new` y personalizar estructura
2. **Configuración de base de datos**: Agregar TypeORM + PostgreSQL
3. **Configuración de servidor**: Integrar Fastify
4. **Configuración de testing**: Jest + configuración inicial
5. **Configuración de documentación**: Swagger UI
6. **Configuración de Docker**: docker-compose para servicios locales
7. **Configuración de variables de entorno**: @nestjs/config + class-validator

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | New | Dependencias NestJS, TypeORM, Fastify, Swagger, etc. |
| `src/` | New | Estructura base del proyecto |
| `docker-compose.yml` | New | Servicios de PostgreSQL y aplicación |
| `Dockerfile` | New | Imagen de la aplicación |
| `test/` | New | Configuración de tests |
| `.env.example` | New | Variables de entorno de ejemplo |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Problemas de compatibilidad Fastify + NestJS | Low | Usar @nestjs/platform-fastify oficial |
| TypeORM con PostgreSQL performa | Low | Configurar índices y conexiones apropiadamente |

## Rollback Plan

1. Eliminar directorio src/ completo y package.json
2. Eliminar archivos Docker
3. Eliminar configuración de tests
4. Volver a ejecutar `nest new` si es necesario

## Dependencies

- Node.js 18+ (verificar con .nvmrc)
- Docker y Docker Compose instalados localmente

## Success Criteria

- [ ] Proyecto NestJS levanta sin errores
- [ ] Health check endpoint responde correctamente
- [ ] Swagger UI accesible en /docs
- [ ] Tests unitarios pasan
- [ ] Docker Compose levanta PostgreSQL + aplicación
- [ ] Configuración de variables de entorno funciona con class-validator