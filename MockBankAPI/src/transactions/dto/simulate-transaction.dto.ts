import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  NotEquals,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SimulateTransactionDto {
  @IsMongoId()
  accountId!: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @NotEquals(0, { message: 'amount must not be 0' })
  amount!: number; // grosze, ujemne = wydatek, dodatnie = wpływ

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  counterparty?: string;

  @IsOptional()
  @IsString()
  categoryHint?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date?: Date;
}
