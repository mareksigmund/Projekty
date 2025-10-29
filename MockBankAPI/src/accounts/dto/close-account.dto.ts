import { IsString, MinLength, MaxLength } from 'class-validator';

export class CloseAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  confirmName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;
}
