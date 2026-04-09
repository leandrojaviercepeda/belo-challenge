# Belo Challenge

API REST para manejo de transacciones entre cuentas.

## Stack

- **Framework**: NestJS + Fastify
- **Base de datos**: PostgreSQL + TypeORM
- **Documentación**: Swagger UI (`/docs`)
- **Testing**: Jest
- **Contenedores**: Docker + Docker Compose

## Requisitos

- Node.js 18+
- Docker y Docker Compose

## Setup

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

## Desarrollo

```bash
# Iniciar PostgreSQL (Docker)
docker-compose up -d postgres

# Levantar app en modo desarrollo
npm run start:dev
```

## Endpoints

### Health

- `GET /health` — Estado de la app y BBDD
- `GET /health/live` — Verificar si la app está viva
- `GET /health/ready` — Verificar si la app está lista
- `GET /docs` — Documentación Swagger

### Autenticación

- `POST /auth/register` — Registrar nuevo usuario
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "accessToken": "...", "refreshToken": "...", "user": {...} }`
  - Status: 201 Created

- `POST /auth/login` — Iniciar sesión
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "accessToken": "...", "refreshToken": "...", "user": {...} }`
  - Status: 200 OK

- `GET /auth/profile` — Obtener perfil del usuario (requiere token)
  - Headers: `Authorization: Bearer <access_token>`
  - Returns: `{ "id": "...", "email": "...", "createdAt": "...", "updatedAt": "..." }`
  - Status: 200 OK / 401 Unauthorized

## Tests

```bash
# Unit tests
npm test

# E2E tests (requiere PostgreSQL)
npm run test:e2e

# Tests con coverage
npm run test:cov
```

## Docker

```bash
# Levantar todo (PostgreSQL + app)
docker-compose up
```
