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
   * Referencia única de la transacción (opcional).
   * Si no se proporciona, se genera automáticamente.
   * Usar para evitar transacciones duplicadas.
   */
  @ApiPropertyOptional({
    description: 'Referencia única (opcional, se genera si no se provee)',
    example: 'TXN-12345',
  })
  @IsString()
  @IsOptional()
  reference?: string;

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
   * Código de moneda (opcional, default: ARS - Pesos Argentinos).
   * Por ahora solo se soporta ARS.
   */
  @ApiPropertyOptional({
    description: 'Código de moneda (default: ARS)',
    example: 'ARS',
  })
  @IsOptional()
  @IsString()
  currency?: string = 'ARS';
}
