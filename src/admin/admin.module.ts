import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';

/**
 * Módulo administrativo para gestión de usuarios.
 * Endpoints para admins (requiere JWT).
 */
@Module({
  imports: [UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
