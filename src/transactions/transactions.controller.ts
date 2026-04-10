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
  ApiProperty,
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
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Crea una nueva transacción entre el usuario autenticado y otro usuario.
   * POST /transactions
   * @param req - Request con usuario desde JWT guard
   * @param createTransactionDto - Datos de la transferencia
   * @returns Transacción creada con estado COMPLETED
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva transacción entre usuarios' })
  @ApiResponse({
    status: 201,
    description: 'Transacción creada exitosamente',
    type: TransactionResponseDto,
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
   * @param req - Request con usuario desde JWT guard
   * @param id - ID de la transacción
   * @returns Datos de la transacción
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una transacción por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Datos de la transacción',
    type: TransactionResponseDto,
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
