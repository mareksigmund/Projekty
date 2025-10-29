import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { Account, AccountSchema } from 'src/accounts/schemas/account.schema';
import { WebhooksModule } from 'src/webhooks/webhooks.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
    WebhooksModule,
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
