import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transaction.entity';
import { TransactionStatus } from './transaction-status.enum';
import { User } from '../users/user.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let dataSource: DataSource;

  const mockUserSender: User = {
    id: 'sender-id',
    email: 'sender@example.com',
    password: 'hashedpassword',
    balance: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
    hashPassword: jest.fn(),
  } as User;

  const mockUserRecipient: User = {
    id: 'recipient-id',
    email: 'recipient@example.com',
    password: 'hashedpassword',
    balance: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
    hashPassword: jest.fn(),
  } as User;

  const mockTransaction: Transaction = {
    id: 'transaction-id',
    fromUserId: 'sender-id',
    toUserId: 'recipient-id',
    amount: 50,
    currency: 'ARS',
    status: TransactionStatus.COMPLETED,
    idempotencyKey: 'test-key',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Transaction;

  const mockTransactionRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, number> = {
        TRANSACTION_RECURRENCE_WINDOW_MINUTES: 5,
        TRANSACTION_RECURRENCE_THRESHOLD: 3,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: 'TransactionRepository',
          useValue: mockTransactionRepository,
        },
        { provide: 'UserRepository', useValue: { findOne: jest.fn() } },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    dataSource = module.get(DataSource);

    // Reset mock implementations
    jest.clearAllMocks();
  });

  const setupSuccessfulTransfer = () => {
    // Verificación de idempotencia DENTRO de la transacción
    mockQueryRunner.manager.findOne.mockResolvedValue(null);
    // Ambos usuarios se bloquean simultáneamente con find + lock
    mockQueryRunner.manager.find.mockResolvedValue([
      mockUserSender,
      mockUserRecipient,
    ]);
    mockQueryRunner.manager.save
      .mockResolvedValueOnce({ ...mockUserSender, balance: 50 })
      .mockResolvedValueOnce({ ...mockUserRecipient, balance: 100 })
      .mockResolvedValueOnce(mockTransaction);
  };

  describe('createTransaction', () => {
    const createDto = {
      toUserId: 'recipient-id',
      amount: 50,
      currency: 'ARS',
    };

    it('should create a successful transfer', async () => {
      setupSuccessfulTransfer();
      mockTransactionRepository.create.mockReturnValue(mockTransaction);

      const result = await service.createTransaction('sender-id', createDto);

      expect(result.fromUserId).toBe('sender-id');
      expect(result.toUserId).toBe('recipient-id');
      expect(result.amount).toBe(50);
      expect(result.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should return existing transaction for duplicate idempotencyKey', async () => {
      // Verificación de idempotencia DENTRO de la transacción
      mockQueryRunner.manager.findOne.mockResolvedValue(mockTransaction);

      const result = await service.createTransaction('sender-id', {
        ...createDto,
        idempotencyKey: 'test-key',
      });

      expect(result).toEqual(
        expect.objectContaining({ id: mockTransaction.id }),
      );
      expect(mockQueryRunner.manager.find).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if recipient does not exist', async () => {
      // Verificación de idempotencia DENTRO de la transacción
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.find.mockResolvedValue([mockUserSender]); // Solo el sender existe

      await expect(
        service.createTransaction('sender-id', createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when transferring to self', async () => {
      // Verificación de idempotencia DENTRO de la transacción
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.find.mockResolvedValue([mockUserSender]);

      await expect(
        service.createTransaction('sender-id', {
          ...createDto,
          toUserId: 'sender-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      // Verificación de idempotencia DENTRO de la transacción
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      const insufficientSender = { ...mockUserSender, balance: 30 };
      mockQueryRunner.manager.find.mockResolvedValue([
        insufficientSender,
        mockUserRecipient,
      ]);

      await expect(
        service.createTransaction('sender-id', createDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransaction', () => {
    it('should return transaction if user is sender', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.getTransaction(
        'transaction-id',
        'sender-id',
      );

      expect(result.id).toBe('transaction-id');
    });

    it('should return transaction if user is recipient', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.getTransaction(
        'transaction-id',
        'recipient-id',
      );

      expect(result.id).toBe('transaction-id');
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getTransaction('non-existent', 'sender-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not sender or recipient', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(mockTransaction);

      await expect(
        service.getTransaction('transaction-id', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('recurrence blocking', () => {
    const createDto = {
      toUserId: 'recipient-id',
      amount: 50,
      currency: 'ARS',
    };

    it('should allow transaction when below threshold', async () => {
      (service as any).recurrenceCounter.set('sender-id', {
        count: 2,
        windowStart: new Date(),
      });

      // Verificación de idempotencia DENTRO de la transacción
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.find.mockResolvedValue([
        mockUserSender,
        mockUserRecipient,
      ]);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockTransaction);

      const result = await service.createTransaction('sender-id', createDto);

      expect(result).toBeDefined();
    });

    it('should block transaction with 429 when threshold exceeded', async () => {
      (service as any).recurrenceCounter.set('sender-id', {
        count: 3,
        windowStart: new Date(),
      });

      // No llega a la transacción porque el check de recurrencia falla primero
      await expect(
        service.createTransaction('sender-id', createDto),
      ).rejects.toThrow(HttpException);
    });

    it('should allow transaction after window expires', async () => {
      const expiredWindow = new Date(Date.now() - 6 * 60 * 1000);
      (service as any).recurrenceCounter.set('sender-id', {
        count: 3,
        windowStart: expiredWindow,
      });

      // Verificación de idempotencia DENTRO de la transacción
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.find.mockResolvedValue([
        { ...mockUserSender, balance: 100 },
        mockUserRecipient,
      ]);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockTransaction);

      const result = await service.createTransaction('sender-id', createDto);

      expect(result).toBeDefined();
    });

    it('should block transaction with 429 when threshold exceeded', async () => {
      (service as any).recurrenceCounter.set('sender-id', {
        count: 3,
        windowStart: new Date(),
      });

      // No llega a la transacción porque el check de recurrencia falla primero

      await expect(
        service.createTransaction('sender-id', createDto),
      ).rejects.toThrow(HttpException);
    });

    it('should allow transaction after window expires', async () => {
      const expiredWindow = new Date(Date.now() - 6 * 60 * 1000);
      (service as any).recurrenceCounter.set('sender-id', {
        count: 3,
        windowStart: expiredWindow,
      });

      mockTransactionRepository.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.find.mockResolvedValue([
        { ...mockUserSender, balance: 100 },
        mockUserRecipient,
      ]);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockTransaction);

      const result = await service.createTransaction('sender-id', createDto);

      expect(result).toBeDefined();
    });
  });
});
