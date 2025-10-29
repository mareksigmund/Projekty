import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGlobalGuard } from './auth/jwt-global.guard';
import { envSchema } from './config/env.validation';
import { ThrottlerModule } from '@nestjs/throttler';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_TTL') ?? 60,
          limit: config.get<number>('RATE_LIMIT') ?? 100,
        },
      ],
    }),
    AccountsModule,
    TransactionsModule,
    WebhooksModule,
    UsersModule,
    AuthModule,
    IntegrationsModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: JwtGlobalGuard }],
})
export class AppModule {}
