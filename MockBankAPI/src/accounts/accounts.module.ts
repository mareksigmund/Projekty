import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    UsersModule,
  ],
  providers: [AccountsService],
  controllers: [AccountsController],
  exports: [AccountsService],
})
export class AccountsModule {}
