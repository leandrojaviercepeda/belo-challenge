import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SetBalanceDto } from './dto/set-balance.dto';

/**
 * Controlador para administración de usuarios.
 * Endpoints protegidos con JWT.
 */
@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Consulta el balance de un usuario.
   * GET /admin/users/:id/balance
   */
  @Get('users/:id/balance')
  @ApiOperation({ summary: 'Consultar balance de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Balance del usuario',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        balance: 1000,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getBalance(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return { id: user.id, email: user.email, balance: user.balance };
  }

  /**
   * Actualiza el balance de un usuario.
   * PUT /admin/users/:id/balance
   */
  @Put('users/:id/balance')
  @ApiOperation({ summary: 'Actualizar balance de un usuario' })
  @ApiResponse({
    status: 200,
    description: 'Balance actualizado',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        balance: 2000,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async setBalance(
    @Param('id') id: string,
    @Body() setBalanceDto: SetBalanceDto,
  ) {
    const user = await this.usersService.updateBalance(
      id,
      setBalanceDto.amount,
    );
    return {
      id: user.id,
      email: user.email,
      balance: user.balance,
    };
  }
}
