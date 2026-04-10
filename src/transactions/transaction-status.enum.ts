/**
 * Enum de estados de transacción.
 * Define los estados posibles de una transacción.
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}
