import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Servicio de salud de la aplicación.
 * Verifica el estado del servicio y la conexión a la base de datos.
 */
@Injectable()
export class HealthService {
  constructor(private dataSource: DataSource) {}

  /**
   * Verifica el estado general de la aplicación.
   * @returns Estado de la aplicación incluyendo base de datos
   */
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: await this.checkDatabase(),
    };
  }

  /**
   * Verifica la conexión a la base de datos.
   * @returns Estado de la conexión ('connected' o 'disconnected')
   */
  async checkDatabase(): Promise<string> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
