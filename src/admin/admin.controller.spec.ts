import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let usersService: UsersService;

  const mockUser: User = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashedpassword',
    balance: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
    hashPassword: jest.fn(),
  } as User;

  const mockUsersService = {
    findById: jest.fn(),
    updateBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.getBalance('user-id-123');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        balance: mockUser.balance,
      });
      expect(mockUsersService.findById).toHaveBeenCalledWith('user-id-123');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(controller.getBalance('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setBalance', () => {
    it('should update user balance', async () => {
      const updatedUser = { ...mockUser, balance: 2000 };
      mockUsersService.updateBalance.mockResolvedValue(updatedUser);

      const result = await controller.setBalance('user-id-123', {
        amount: 2000,
      });

      expect(result.balance).toBe(2000);
      expect(mockUsersService.updateBalance).toHaveBeenCalledWith(
        'user-id-123',
        2000,
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.updateBalance.mockRejectedValue(new NotFoundException());

      await expect(
        controller.setBalance('non-existent', { amount: 1000 }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
