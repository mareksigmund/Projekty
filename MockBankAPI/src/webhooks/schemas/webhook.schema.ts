import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookDocument = HydratedDocument<Webhook>;

@Schema({ timestamps: true, versionKey: false })
export class Webhook {
  @Prop({ required: true, index: true })
  clientId!: string;

  @Prop({ required: true })
  url!: string;

  // zamiast plaintext 'secret' trzymamy obiekt szyfrogramu
  @Prop({ type: Object, required: true })
  secretEnc!: {
    alg: 'aes-256-gcm';
    keyId: string;
    iv: string;
    tag: string;
    ct: string;
  };

  @Prop({ type: [String], required: true })
  events!: string[];

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const WebhookSchema = SchemaFactory.createForClass(Webhook);
WebhookSchema.index({ clientId: 1, url: 1 }, { unique: true });
