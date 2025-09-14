import {
  IsArray,
  ArrayNotEmpty,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

const SUPPORTED_EVENTS = ['transaction.created'] as const;
export type SupportedEvent = (typeof SUPPORTED_EVENTS)[number];

export class CreateWebhookDto {
  @IsUrl({ require_tld: false })
  url!: string;

  @IsString()
  @Length(16, 128)
  secret!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(SUPPORTED_EVENTS as unknown as string[], { each: true })
  events!: SupportedEvent[];

  @IsOptional()
  @IsString()
  _ignoredClientId?: string;
}
