import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Webhook, WebhookSchema } from './schemas/webhook.schema';
import { ConfigModule } from '@nestjs/config';
import { CryptoService } from 'src/common/crypto.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Webhook.name, schema: WebhookSchema }]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, CryptoService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
