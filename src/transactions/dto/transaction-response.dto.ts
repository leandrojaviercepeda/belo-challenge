import { TransactionStatus } from '../transaction-status.enum';

/**
 * DTO de respuesta para una transacción.
 * Contiene los datos públicos de la transacción creada.
 */
export class TransactionResponseDto {
  /** ID único de la transacción */
  id: string;

  /** ID del usuario que envía */
  fromUserId: string;

  /** ID del usuario que recibe */
  toUserId: string;

  /** Monto transferido */
  amount: number;

  /** Código de moneda */
  currency: string;

  /** Estado de la transacción */
  status: TransactionStatus;

  /** Referencia única de la transacción */
  reference: string;

  /** Fecha de creación */
  createdAt: Date;
}
