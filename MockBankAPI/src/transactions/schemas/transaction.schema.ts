import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

/**
 * Transakcja bankowa.
 * amount: minor units (grosze), ujemne = wydatek, dodatnie = wpływ.
 */

@Schema({ timestamps: true, versionKey: false })
export class Transaction {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  accountId!: Types.ObjectId; // _id z kolekcji accounts

  @Prop({ required: true })
  amount!: number; // np. -1299 => -12.99 PLN

  @Prop({ required: true, default: 'PLN' })
  currency!: string;

  @Prop({ required: true })
  date!: Date; // data operacji (UTC)

  @Prop({ required: true })
  description!: string;

  @Prop()
  counterparty?: string;

  @Prop()
  categoryHint?: string; // np. "groceries"

  @Prop({ index: true, sparse: true })
  externalTxnId?: string; // dla idempotencji (webhooki)

  @Prop({ type: Object })
  raw?: Record<string, any>;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ accountId: 1, date: -1 }); // lista po dacie
