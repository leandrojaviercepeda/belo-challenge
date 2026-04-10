import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Transaction } from './transaction.entity';
import { TransactionStatus } from './transaction-status.enum';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { User } from '../users/user.entity';

interface TransactionCounter {
  count: number;
  windowStart: Date;
}

@Injectable()
export class TransactionsService {
  private recurrenceCounter: Map<string, TransactionCounter> = new Map();

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async createTransaction(
    fromUserId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const idempotencyKey = dto.idempotencyKey || crypto.randomUUID();

    // 1. Check idempotency
    const existingTransaction = await this.transactionRepository.findOne({
      where: { idempotencyKey },
    });
    if (existingTransaction) {
      return this.toResponseDto(existingTransaction);
    }

    // 2. Check recurrence block
    this.checkRecurrenceBlock(fromUserId);

    // 3. Execute atomic transaction with pessimistic lock
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Lock sender and validate balance within the transaction
      const sender = await queryRunner.manager.findOne(User, {
        where: { id: fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sender) {
        throw new NotFoundException('Sender user not found');
      }

      if (sender.id === dto.toUserId) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

      const recipient = await queryRunner.manager.findOne(User, {
        where: { id: dto.toUserId },
      });

      if (!recipient) {
        throw new NotFoundException('Recipient user not found');
      }

      if (sender.balance < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct from sender
      sender.balance = Number(sender.balance) - dto.amount;
      await queryRunner.manager.save(sender);

      // Add to recipient
      recipient.balance = Number(recipient.balance) + dto.amount;
      await queryRunner.manager.save(recipient);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        fromUserId: sender.id,
        toUserId: recipient.id,
        amount: dto.amount,
        currency: dto.currency || 'USD',
        status: TransactionStatus.COMPLETED,
        idempotencyKey,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      // Update recurrence counter
      this.incrementRecurrenceCounter(fromUserId);

      return this.toResponseDto(savedTransaction);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransaction(
    id: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.fromUserId !== userId && transaction.toUserId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this transaction',
      );
    }

    return this.toResponseDto(transaction);
  }

  private checkRecurrenceBlock(userId: string): void {
    const windowMinutes =
      this.configService.get<number>('TRANSACTION_RECURRENCE_WINDOW_MINUTES') ||
      5;
    const threshold =
      this.configService.get<number>('TRANSACTION_RECURRENCE_THRESHOLD') || 3;

    const counter = this.recurrenceCounter.get(userId);
    if (!counter) return;

    const now = new Date();
    const windowEnd = new Date(
      counter.windowStart.getTime() + windowMinutes * 60 * 1000,
    );

    if (now < windowEnd && counter.count >= threshold) {
      throw new HttpException(
        {
          reason: 'recurrence blocked',
          message: 'Too many transactions in short time',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Reset if window expired
    if (now >= windowEnd) {
      this.recurrenceCounter.delete(userId);
    }
  }

  private incrementRecurrenceCounter(userId: string): void {
    const windowMinutes =
      this.configService.get<number>('TRANSACTION_RECURRENCE_WINDOW_MINUTES') ||
      5;
    const now = new Date();

    const counter = this.recurrenceCounter.get(userId);
    if (!counter) {
      this.recurrenceCounter.set(userId, { count: 1, windowStart: now });
      return;
    }

    const windowEnd = new Date(
      counter.windowStart.getTime() + windowMinutes * 60 * 1000,
    );
    if (now < windowEnd) {
      counter.count++;
    } else {
      // Start new window
      this.recurrenceCounter.set(userId, { count: 1, windowStart: now });
    }
  }

  private toResponseDto(transaction: Transaction): TransactionResponseDto {
    return {
      id: transaction.id,
      fromUserId: transaction.fromUserId,
      toUserId: transaction.toUserId,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      status: transaction.status,
      idempotencyKey: transaction.idempotencyKey,
      createdAt: transaction.createdAt,
    };
  }
}
