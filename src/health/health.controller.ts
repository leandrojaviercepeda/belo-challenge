import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verificar estado de la aplicación' })
  @ApiResponse({ status: 200, description: 'Estado de la aplicación' })
  async check() {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Verificar si la aplicación está viva' })
  @ApiResponse({ status: 200, description: 'Aplicación viva' })
  live() {
    return { status: 'live' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificar si la aplicación está lista' })
  @ApiResponse({ status: 200, description: 'Aplicación lista' })
  async ready() {
    const dbStatus = await this.healthService.checkDatabase();
    return {
      status: dbStatus === 'connected' ? 'ready' : 'not-ready',
      database: dbStatus,
    };
  }
}
