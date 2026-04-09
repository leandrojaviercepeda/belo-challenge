import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('constructor', () => {
    it('should be created', () => {
      expect(guard).toBeDefined();
    });
  });

  describe('instance checks', () => {
    it('should have canActivate method', () => {
      expect(typeof guard.canActivate).toBe('function');
    });

    it('should have handleRequest method', () => {
      expect(typeof guard.handleRequest).toBe('function');
    });

    it('should have logIn method', () => {
      expect(typeof guard.logIn).toBe('function');
    });
  });
});
