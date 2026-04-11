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
   *
   * Reglas de negocio:
   * - Si monto > $50000 → estado = PENDING (sin débito/crédito)
   * - Si monto ≤ $50000 → estado = COMPLETED (con débito/crédito)
   * - Si falla → estado = FAILED
   *
   * @param fromUserId - ID del usuario que envía dinero
   * @param dto - Datos de la transacción (toUserId, amount, etc.)
   * @returns Transacción creada o existente (si reference ya existía)
   */
  async createTransaction(
    fromUserId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const AMOUNT_THRESHOLD = 50000;
    const isLargeAmount = dto.amount > AMOUNT_THRESHOLD;

    // Usar reference del DTO o generar una única
    const reference = dto.reference || crypto.randomUUID();

    // 1. Check recurrence fuera de la transacción (no necesita bloqueo)
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
          where: { reference },
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

      // 2.3 Determinar estado según monto
      let transactionStatus: TransactionStatus;

      if (isLargeAmount) {
        // Monto > $50000: queda pendiente, NO se debita/credita aún
        transactionStatus = TransactionStatus.PENDING;
      } else {
        // Monto ≤ $50000: validar saldo y procesar inmediatamente
        if (sender.balance < dto.amount) {
          throw new BadRequestException('Insufficient balance');
        }

        // Deduct from sender
        sender.balance = Number(sender.balance) - dto.amount;
        await queryRunner.manager.save(sender);

        // Add to recipient
        recipient.balance = Number(recipient.balance) + dto.amount;
        await queryRunner.manager.save(recipient);

        transactionStatus = TransactionStatus.COMPLETED;
      }

      // 2.4 Create transaction record
      const transaction = this.transactionRepository.create({
        fromUserId: sender.id,
        toUserId: recipient.id,
        amount: dto.amount,
        currency: dto.currency || 'ARS',
        status: transactionStatus,
        reference,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      // Update recurrence counter solo si fue exitosa
      this.incrementRecurrenceCounter(fromUserId);

      return this.toResponseDto(savedTransaction);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Si el error no es de validación (4xx), crear registro FAILED
      // Esto solo aplica para transacciones pequeñas que fallaron en el proceso
      if (!isLargeAmount && error instanceof HttpException) {
        throw error;
      }

      // Crear registro de transacción fallida si es posible
      // (Esto es para casos raros donde falla el procesamiento de transacciones pequeñas)
      try {
        const failedTransaction = this.transactionRepository.create({
          fromUserId,
          toUserId: dto.toUserId,
          amount: dto.amount,
          currency: dto.currency || 'ARS',
          status: TransactionStatus.FAILED,
          reference,
        });
        await this.transactionRepository.save(failedTransaction);
      } catch (_) {
        // Si no se puede crear, ignorar - el error original es más importante
      }

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
   * Lista las transacciones de un usuario (como origen o destino).
   * @param userId - ID del usuario
   * @param page - Número de página
   * @param limit - Resultados por página
   * @returns Lista paginada de transacciones
   */
  async findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    data: TransactionResponseDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: [{ fromUserId: userId }, { toUserId: userId }],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    return {
      data: transactions.map((t) => this.toResponseDto(t)),
      meta: { total, page, limit },
    };
  }

  /**
   * Aprueba una transacción pendiente y realiza el movimiento de fondos.
   * Solo admins pueden ejecutar esta acción.
   * @param id - ID de la transacción
   * @returns Transacción actualizada
   * @throws NotFoundException - Si la transacción no existe
   * @throws BadRequestException - Si la transacción no está pendiente
   */
  async approve(id: string): Promise<TransactionResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Obtener transacción con lock
      const transaction = await manager.findOne(Transaction, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Transaction is not pending');
      }

      // 2. Obtener usuarios con lock
      const [fromUser, toUser] = await Promise.all([
        manager.findOne(User, {
          where: { id: transaction.fromUserId },
          lock: { mode: 'pessimistic_write' },
        }),
        manager.findOne(User, {
          where: { id: transaction.toUserId },
          lock: { mode: 'pessimistic_write' },
        }),
      ]);

      if (!fromUser || !toUser) {
        throw new NotFoundException('User not found');
      }

      // 3. Validar saldo suficiente
      const fromUserBalance = Number(fromUser.balance);
      if (fromUserBalance < transaction.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // 4. Débito y crédito atómico
      fromUser.balance = fromUserBalance - transaction.amount;
      toUser.balance = Number(toUser.balance) + transaction.amount;

      await manager.save(fromUser);
      await manager.save(toUser);

      // 5. Actualizar estado transacción
      transaction.status = TransactionStatus.COMPLETED;
      const savedTransaction = await manager.save(transaction);

      return this.toResponseDto(savedTransaction);
    });
  }

  /**
   * Rechaza una transacción pendiente.
   * No modifica los saldos de los usuarios.
   * Solo admins pueden ejecutar esta acción.
   * @param id - ID de la transacción
   * @returns Transacción actualizada
   * @throws NotFoundException - Si la transacción no existe
   * @throws BadRequestException - Si la transacción no está pendiente
   */
  async reject(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Transaction is not pending');
    }

    transaction.status = TransactionStatus.REJECTED;
    const savedTransaction = await this.transactionRepository.save(transaction);

    return this.toResponseDto(savedTransaction);
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
      reference: transaction.reference,
      createdAt: transaction.createdAt,
    };
  }
}
