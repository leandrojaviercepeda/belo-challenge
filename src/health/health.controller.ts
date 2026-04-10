import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controlador de salud de la aplicación.
 * Proporciona endpoints para verificar el estado del servicio.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado de la aplicación' })
  @ApiResponse({
    status: 200,
    description: 'Estado de la aplicación',
    schema: {
      example: {
        status: 'ok',
        uptime: 1234.56,
        timestamp: '2026-04-10T12:00:00.000Z',
      },
    },
  })
  async check() {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Verificar si la aplicación está viva' })
  @ApiResponse({
    status: 200,
    description: 'Aplicación viva',
    schema: {
      example: { status: 'live' },
    },
  })
  live() {
    return { status: 'live' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificar si la aplicación está lista' })
  @ApiResponse({
    status: 200,
    description: 'Aplicación lista',
    schema: {
      example: { status: 'ready', database: 'connected' },
    },
  })
  async ready() {
    const dbStatus = await this.healthService.checkDatabase();
    return {
      status: dbStatus === 'connected' ? 'ready' : 'not-ready',
      database: dbStatus,
    };
  }
}
