import {
  IsUUID,
  IsOptional,
  IsPositive,
  IsNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear una nueva transacción.
 * Valida los datos de entrada antes de procesar la transferencia.
 */
export class CreateTransactionDto {
  /**
   * Clave de idempotencia (opcional).
   * Si no se proporciona, se genera automáticamente.
   * Usar la misma clave para evitar transacciones duplicadas.
   */
  @ApiPropertyOptional({
    description: 'Clave de idempotencia (opcional, se genera si no se provee)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  idempotencyKey?: string;

  /**
   * ID del usuario que recibe el dinero.
   * Debe ser un UUID válido de un usuario existente.
   */
  @ApiProperty({
    description: 'ID del usuario que recibe el dinero',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  toUserId: string;

  /**
   * Cantidad a transferir.
   * Debe ser un número mayor a 0.
   */
  @ApiProperty({
    description: 'Cantidad a transferir (mayor a 0)',
    example: 100,
  })
  @IsPositive()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amount: number;

  /**
   * Código de moneda (opcional, default: USD).
   * Por ahora solo se soporta USD.
   */
  @ApiPropertyOptional({
    description: 'Código de moneda (default: USD)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';
}
