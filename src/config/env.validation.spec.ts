import 'reflect-metadata';
import { validate, EnvironmentVariables } from './env.validation';

describe('EnvironmentVariables', () => {
  describe('validate', () => {
    it('should return valid config for valid input', () => {
      const config = {
        NODE_ENV: 'development',
        PORT: '3000',
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5432',
        DATABASE_USER: 'postgres',
        DATABASE_PASSWORD: 'postgres',
        DATABASE_NAME: 'belo_challenge',
      };

      const result = validate(config);

      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(3000);
      expect(result.DATABASE_HOST).toBe('localhost');
      expect(result.DATABASE_PORT).toBe(5432);
    });

    it('should throw error for invalid NODE_ENV', () => {
      const config = {
        NODE_ENV: 'invalid',
        PORT: '3000',
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5432',
        DATABASE_USER: 'postgres',
        DATABASE_PASSWORD: 'postgres',
        DATABASE_NAME: 'belo_challenge',
      };

      expect(() => validate(config)).toThrow();
    });

    it('should use default values when optional fields are missing', () => {
      const config = {
        NODE_ENV: 'development',
        // Missing optional fields should use defaults
      };

      const result = validate(config);

      expect(result.PORT).toBe(3000);
    });

    it('should throw error for invalid PORT', () => {
      const config = {
        NODE_ENV: 'development',
        PORT: 'not-a-number',
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5432',
        DATABASE_USER: 'postgres',
        DATABASE_PASSWORD: 'postgres',
        DATABASE_NAME: 'belo_challenge',
      };

      expect(() => validate(config)).toThrow();
    });
  });
});
