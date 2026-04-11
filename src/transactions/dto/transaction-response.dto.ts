import { TransactionStatus } from '../transaction-status.enum';

/**
 * DTO de respuesta para una transacción.
 */
export class TransactionResponseDto {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  reference: string;
  createdAt: Date;
}

/**
 * DTO de respuesta paginada para listado de transacciones.
 */
export class PaginatedTransactionsDto {
  data: TransactionResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
