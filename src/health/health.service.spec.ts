import { HealthService } from './health.service';
import { DataSource } from 'typeorm';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    const mockDataSource = {
      query: jest.fn(),
    };

    service = new HealthService(mockDataSource as any);
    dataSource = mockDataSource as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return ok status with connected database', async () => {
      dataSource.query.mockResolvedValue([{ result: 1 }]);

      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.database).toBe('connected');
    });

    it('should return ok status with disconnected database', async () => {
      dataSource.query.mockRejectedValue(new Error('Connection failed'));

      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('disconnected');
    });
  });

  describe('checkDatabase', () => {
    it('should return connected when query succeeds', async () => {
      dataSource.query.mockResolvedValue([{ result: 1 }]);

      const result = await service.checkDatabase();

      expect(result).toBe('connected');
      expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return disconnected when query fails', async () => {
      dataSource.query.mockRejectedValue(new Error('Connection failed'));

      const result = await service.checkDatabase();

      expect(result).toBe('disconnected');
    });
  });
});
