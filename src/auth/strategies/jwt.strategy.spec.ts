import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
      ],
      providers: [
        JwtStrategy,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when token is valid', async () => {
      const mockUser = {
        id: '123',
        email: 'test@belo.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
        validatePassword: jest.fn(),
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const payload = { sub: '123', email: 'test@belo.com' };
      const result = await jwtStrategy.validate(payload);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('123');
      expect(result).toEqual({ id: '123', email: 'test@belo.com' });
    });

    it('should throw when user not found', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      const payload = { sub: 'notfound', email: 'test@belo.com' };

      await expect(jwtStrategy.validate(payload)).rejects.toThrow();
    });
  });
});
