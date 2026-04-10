import { TransactionStatus } from '../transaction-status.enum';

export class TransactionResponseDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  idempotencyKey: string;
  createdAt: Date;
}
