# Belo Challenge

API REST para manejo de transacciones entre cuentas.

## Stack

- **Framework**: NestJS + Fastify
- **Base de datos**: PostgreSQL + TypeORM

## Setup

```bash
npm install
cp .env.example .env
```

## Desarrollo

```bash
# Levantar todo (app + PostgreSQL)
docker-compose up
```

## Endpoints

- `GET /health` — Estado de la app
- `POST /auth/register` — Registrar usuario
- `POST /auth/login` — Iniciar sesión
- `GET /docs` — Swagger
