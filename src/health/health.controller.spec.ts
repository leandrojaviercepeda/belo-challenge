import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: jest.Mocked<HealthService>;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn(),
      checkDatabase: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', async () => {
      const mockHealthResponse = {
        status: 'ok',
        timestamp: '2026-04-09T00:00:00.000Z',
        database: 'connected',
      };
      service.check.mockResolvedValue(mockHealthResponse);

      const result = await controller.check();

      expect(result).toEqual(mockHealthResponse);
      expect(service.check).toHaveBeenCalled();
    });
  });

  describe('live', () => {
    it('should return live status', () => {
      const result = controller.live();

      expect(result).toEqual({ status: 'live' });
    });
  });

  describe('ready', () => {
    it('should return ready status when database is connected', async () => {
      service.checkDatabase.mockResolvedValue('connected');

      const result = await controller.ready();

      expect(result).toEqual({
        status: 'ready',
        database: 'connected',
      });
    });

    it('should return not-ready status when database is disconnected', async () => {
      service.checkDatabase.mockResolvedValue('disconnected');

      const result = await controller.ready();

      expect(result).toEqual({
        status: 'not-ready',
        database: 'disconnected',
      });
    });
  });
});
