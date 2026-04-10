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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async createTransaction(
    @Req() req: Request & { user: { id: string; email: string } },
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.createTransaction(
      req.user.id,
      createTransactionDto,
    );
  }

  @Get(':id')
  async getTransaction(
    @Req() req: Request & { user: { id: string; email: string } },
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.getTransaction(id, req.user.id);
  }
}
