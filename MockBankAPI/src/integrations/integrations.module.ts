import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerController } from './owner.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Account, AccountSchema } from '../accounts/schemas/account.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [OwnerController],
})
export class IntegrationsModule {}
