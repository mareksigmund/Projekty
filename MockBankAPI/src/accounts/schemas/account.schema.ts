import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;
/**
 * Konto bankowe w MockBank.
 * Saldo w minor units (grosze), waluta “PLN” (MVP), unikalny IBAN.
 */

@Schema({ timestamps: true, versionKey: false })
export class Account {
  @Prop({ required: true, index: true })
  userId!: string; // np. "demo-user-1"

  @Prop({ required: true })
  name!: string; // np. "Konto PLN"

  @Prop({ required: true, unique: true })
  iban!: string; // unikalny identyfikator konta

  @Prop({ required: true, default: 'PLN' })
  currency!: string; // na MVP trzymamy "PLN"

  @Prop({ required: true, default: 0, min: 0 })
  balance!: number; // saldo w groszach (minor units)

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
// Unikalne IBAN per konto, i szybki dostęp po właścicielu+czasie:
AccountSchema.index({ userId: 1, createdAt: -1 });
AccountSchema.index({ iban: 1 }, { unique: true });
