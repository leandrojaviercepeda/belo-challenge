import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TransactionStatus } from './transaction-status.enum';

/**
 * Entidad que representa una transacción monetaria entre dos usuarios.
 * Almacena el estado de la transferencia, monto, y clave de idempotencia.
 * Cada transacción es única y rastreable mediante su idempotencyKey.
 */
@Entity('transactions')
export class Transaction {
  /**
   * ID único de la transacción (UUID).
   * Se genera automáticamente al crear la transacción.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID del usuario que envía el dinero.
   * Referencia al usuario en la tabla users.
   */
  @Column({ name: 'from_user_id' })
  fromUserId: string;

  /**
   * ID del usuario que recibe el dinero.
   * Referencia al usuario en la tabla users.
   */
  @Column({ name: 'to_user_id' })
  toUserId: string;

  /**
   * Cantidad a transferir.
   * Debe ser mayor a 0 y tener hasta 2 decimales.
   */
  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;

  /**
   * Código de moneda (default: USD).
   * Por ahora solo se soporta USD.
   */
  @Column({ default: 'USD' })
  currency: string;

  /**
   * Estado de la transacción.
   * Puede ser PENDING, COMPLETED, FAILED o REVERSED.
   */
  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  /**
   * Clave de idempotencia para evitar transacciones duplicadas.
   * Debe ser única por usuario emisor.
   */
  @Column({ name: 'idempotency_key', unique: true })
  idempotencyKey: string;

  /**
   * Usuario que envía la transacción.
   * Relación ManyToOne con User entity.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  /**
   * Usuario que recibe la transacción.
   * Relación ManyToOne con User entity.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  /**
   * Fecha de creación de la transacción.
   * Se establece automáticamente al crear.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Fecha de última actualización.
   * Se actualiza automáticamente al modificar.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
