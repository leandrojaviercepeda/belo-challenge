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

- `GET /health` — Estado de la app y BBDD
- `GET /health/live` — Verificar si la app está viva
- `GET /health/ready` — Verificar si la app está lista
- `GET /docs` — Documentación Swagger

## Tests

```bash
npm test
```

## Docker

```bash
# Levantar todo (PostgreSQL + app)
docker-compose up
```
