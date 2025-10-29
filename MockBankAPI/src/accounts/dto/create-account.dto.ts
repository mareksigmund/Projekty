import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;

  @IsIn(['PLN'])
  currency!: string; // MVP: tylko PLN

  @IsOptional()
  @IsInt()
  @Min(0)
  initialBalance?: number; // grosze; domyślnie 0
}
