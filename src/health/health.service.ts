import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private dataSource: DataSource) {}

  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: await this.checkDatabase(),
    };
  }

  async checkDatabase(): Promise<string> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
