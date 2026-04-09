# Tasks: feature/base-project-structure

## 1. Setup Inicial

- [x] 1.1 Crear proyecto NestJS con CLI
- [x] 1.2 Configurar package manager npm
- [x] 1.3 Instalar dependencias base

## 2. Configuración de Base de Datos

- [x] 2.1 Instalar TypeORM + PostgreSQL
- [x] 2.2 Configurar database.config.ts
- [x] 2.3 Configurar TypeOrmModule async en AppModule

## 3. Configuración de Servidor

- [x] 3.1 Instalar @nestjs/platform-fastify
- [x] 3.2 Configurar FastifyAdapter en main.ts
- [x] 3.3 Agregar ValidationPipe con class-validator

## 4. Documentación API

- [x] 4.1 Instalar @nestjs/swagger + swagger-ui-express
- [x] 4.2 Configurar Swagger en main.ts
- [x] 4.3 Agregar decoradores ApiTags en controllers

## 5. Módulo de Health

- [x] 5.1 Crear HealthModule
- [x] 5.2 Crear HealthController con endpoints /health, /health/live, /health/ready
- [x] 5.3 Crear HealthService con verificación de base de datos

## 6. Errores y Filtros

- [x] 6.1 Crear ErrorBase class
- [x] 6.2 Crear ErrorFilter
- [x] 6.3 Crear ErrorDictionary
- [x] 6.4 Configurar filtro global en main.ts

## 7. Variables de Entorno

- [x] 7.1 Crear env.validation.ts con class-validator
- [x] 7.2 Configurar ConfigModule global
- [x] 7.3 Crear .env.example
- [x] 7.4 Crear .env

## 8. Docker

- [x] 8.1 Crear Dockerfile multi-stage
- [x] 8.2 Crear docker-compose.yml con PostgreSQL + app
- [x] 8.3 Agregar healthcheck para PostgreSQL

## 9. Verificación

- [x] 9.1 Verificar que la app levanta sin errores
- [x] 9.2 Verificar health endpoint responde
- [x] 9.3 Verificar Swagger accesible en /docs
- [x] 9.4 Verificar tests unitarios pasan (14 tests)
- [x] 9.5 Verificar docker-compose levanta servicios

## 10. Tests Unitarios

- [x] 10.1 Crear tests para HealthController
- [x] 10.2 Crear tests para HealthService
- [x] 10.3 Crear tests para env.validation

## 11. Documentación

- [x] 11.1 Actualizar README.md
