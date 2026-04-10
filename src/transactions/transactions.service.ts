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

/**
 * Contador para rastrear la recurrencia de transacciones por usuario.
 * Evita fraudes por múltiples transacciones en poco tiempo.
 */
interface TransactionCounter {
  count: number;
  windowStart: Date;
}

/**
 * Servicio para gestionar transacciones monetarias entre usuarios.
 * Maneja idempotencia, validación de saldo y bloqueo por recurrencia.
 * Todas las operaciones son atómicas para garantizar consistencia.
 */
@Injectable()
export class TransactionsService {
  /**
   * Mapa en memoria para rastrear recurrencia de transacciones.
   * Clave: ID del usuario, Valor: contador con ventana de tiempo.
   */
  private recurrenceCounter: Map<string, TransactionCounter> = new Map();

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  /**
   * Crea una nueva transacción entre dos usuarios.
   * Valida idempotencia, saldo suficiente, y bloqueo por recurrencia.
   * BLOQUEA AMBOS USUARIOS (sender y recipient) con pessimistic_write
   * para evitar inconsistencias por transacciones concurrentes.
   * La verificación de idempotencia está DENTRO de la transacción para evitar duplicados.
   * @param fromUserId - ID del usuario que envía dinero
   * @param dto - Datos de la transacción (toUserId, amount, etc.)
   * @returns Transacción creada o existente (si idempotencyKey ya existía)
   * @throws NotFoundException - Si el usuario destinario no existe
   * @throws BadRequestException - Si saldo insuficiente o transferencia a sí mismo
   * @throws HttpException(429) - Si excede threshold de recurrencia
   */
  async createTransaction(
    fromUserId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const idempotencyKey = dto.idempotencyKey || crypto.randomUUID();

    // 1. Check recurrence fuera de la transacción (no necesita Blochqueo)
    this.checkRecurrenceBlock(fromUserId);

    // 2. Iniciar transacción atómica con bloqueo
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2.1 Verificar idempotencia DENTRO de la transacción (evita duplicados)
      const existingTransaction = await queryRunner.manager.findOne(
        Transaction,
        {
          where: { idempotencyKey },
        },
      );
      if (existingTransaction) {
        await queryRunner.rollbackTransaction();
        return this.toResponseDto(existingTransaction);
      }

      // 2.2 Bloquear AMBOS usuarios (sender y recipient) para evitar inconsistencias
      // Ordenar por ID para evitar deadlocks (menor ID primero)
      const userIds = [fromUserId, dto.toUserId].sort();

      const users = await queryRunner.manager.find(User, {
        where: userIds.map((id) => ({ id })),
        lock: { mode: 'pessimistic_write' },
      });

      const sender = users.find((u) => u.id === fromUserId);
      const recipient = users.find((u) => u.id === dto.toUserId);

      if (!sender) {
        throw new NotFoundException('Sender user not found');
      }

      if (sender.id === dto.toUserId) {
        throw new BadRequestException('Cannot transfer to yourself');
      }

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

  /**
   * Obtiene una transacción por su ID.
   * Solo accesible por los participantes de la transacción.
   * @param id - ID de la transacción a buscar
   * @param userId - ID del usuario que hace la solicitud
   * @returns Datos de la transacción
   * @throws NotFoundException - Si la transacción no existe
   * @throws ForbiddenException - Si el usuario no es participante
   */
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

  /**
   * Verifica si el usuario excede el threshold de recurrencia.
   * Lanzará 429 si hay demasiadas transacciones en la ventana de tiempo.
   * @param userId - ID del usuario a verificar
   * @throws HttpException(429) - Si excede el límite
   */
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

  /**
   * Incrementa el contador de transacciones del usuario.
   * Reinicia la ventana si ya expiró.
   * @param userId - ID del usuario
   */
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

  /**
   * Convierte entity a DTO de respuesta.
   * Excluye campos sensibles y formatea tipos.
   * @param transaction - Entidad de transacción
   * @returns DTO para responder al cliente
   */
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
