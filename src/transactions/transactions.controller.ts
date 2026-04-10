import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controlador REST para gestionar transacciones.
 * Endpoints protegidos con JWT authentication.
 */
@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('JWT-auth')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Crea una nueva transacción entre el usuario autenticado y otro usuario.
   * POST /transactions
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva transacción entre usuarios' })
  @ApiResponse({
    status: 201,
    description: 'Transacción creada exitosamente',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fromUserId: 'abc123def-456',
        toUserId: 'def456abc-789',
        amount: 100,
        currency: 'USD',
        status: 'COMPLETED',
        reference: 'TXN-ABC123',
        createdAt: '2026-04-10T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - saldo insuficiente o transferencia a sí mismo',
  })
  @ApiResponse({ status: 404, description: 'Usuario destinario no encontrado' })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas transacciones en poco tiempo',
  })
  async createTransaction(
    @Req() req: Request & { user: { id: string; email: string } },
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.createTransaction(
      req.user.id,
      createTransactionDto,
    );
  }

  /**
   * Obtiene una transacción por su ID.
   * GET /transactions/:id
   * Solo accesible por los participantes (sender o recipient).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una transacción por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Datos de la transacción',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fromUserId: 'abc123def-456',
        toUserId: 'def456abc-789',
        amount: 100,
        currency: 'USD',
        status: 'COMPLETED',
        reference: 'TXN-ABC123',
        createdAt: '2026-04-10T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  @ApiResponse({
    status: 403,
    description: 'No tienes acceso a esta transacción',
  })
  async getTransaction(
    @Req() req: Request & { user: { id: string; email: string } },
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.getTransaction(id, req.user.id);
  }
}
