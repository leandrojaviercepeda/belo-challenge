// Jest setup file for E2E tests
process.env.NODE_ENV = 'development';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_USER = 'postgres';
process.env.DATABASE_PASSWORD = 'postgres';
process.env.DATABASE_NAME = 'belo_challenge';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.PORT = '3000';
process.env.TRANSACTION_RECURRENCE_WINDOW_MINUTES = '5';
process.env.TRANSACTION_RECURRENCE_THRESHOLD = '3';
