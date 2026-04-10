import {
  IsUUID,
  IsOptional,
  IsPositive,
  IsNumber,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTransactionDto {
  @IsUUID()
  @IsOptional()
  idempotencyKey?: string;

  @IsUUID()
  toUserId: string;

  @IsPositive()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';
}
