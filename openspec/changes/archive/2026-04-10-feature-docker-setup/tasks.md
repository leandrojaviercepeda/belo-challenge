## 1. Docker Configuration

- [x] 1.1 Dockerfile exists with Node 20 base
- [x] 1.2 docker-compose.yml has app + postgres services
- [x] 1.3 .dockerignore excludes unnecessary files

## 2. Verification

- [x] 2.1 docker-compose up starts both services
- [x] 2.2 http://localhost:3000/health returns ok
- [x] 2.3 Database shows "connected" in health response
- [x] 2.4 Hot reload works when modifying source files

## 3. Documentation

- [x] 3.1 README updated with docker-compose command
