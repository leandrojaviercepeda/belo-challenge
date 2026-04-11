import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsQueryDto } from './dto/get-transactions.query.dto';
import {
  TransactionResponseDto,
  PaginatedTransactionsDto,
} from './dto/transaction-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

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
        currency: 'ARS',
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
        currency: 'ARS',
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

  /**
   * Lista las transacciones de un usuario.
   * GET /transactions?userId=...
   */
  @Get()
  @ApiOperation({ summary: 'Listar transacciones de un usuario' })
  @ApiQuery({ name: 'userId', type: String, description: 'ID del usuario' })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Número de página (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Resultados por página (default: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de transacciones',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            fromUserId: 'abc123def-456',
            toUserId: 'def456abc-789',
            amount: 100,
            currency: 'ARS',
            status: 'COMPLETED',
            reference: 'TXN-ABC123',
            createdAt: '2026-04-10T12:00:00.000Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 20 },
      },
    },
  })
  async getTransactions(
    @Query() query: GetTransactionsQueryDto,
  ): Promise<PaginatedTransactionsDto> {
    return this.transactionsService.findByUserId(
      query.userId,
      query.page || 1,
      query.limit || 20,
    );
  }

  /**
   * Aprueba una transacción pendiente.
   * PATCH /transactions/:id/approve
   * Solo accesible por admins.
   */
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Aprobar una transacción pendiente' })
  @ApiResponse({
    status: 200,
    description: 'Transacción aprobada',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'COMPLETED',
        updatedAt: '2026-04-10T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'La transacción no está pendiente' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async approveTransaction(
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.approve(id);
  }

  /**
   * Rechaza una transacción pendiente.
   * PATCH /transactions/:id/reject
   * Solo accesible por admins.
   */
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Rechazar una transacción pendiente' })
  @ApiResponse({
    status: 200,
    description: 'Transacción rechazada',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'REJECTED',
        updatedAt: '2026-04-10T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'La transacción no está pendiente' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async rejectTransaction(
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.reject(id);
  }
}
