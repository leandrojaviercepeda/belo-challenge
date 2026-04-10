import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para establecer el balance de un usuario.
 */
export class SetBalanceDto {
  @ApiProperty({
    description: 'Monto del balance',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}
