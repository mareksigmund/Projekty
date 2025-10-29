import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import { Public } from 'src/auth/public.decorator';

function isValidObjectId(id: string) {
  return Types.ObjectId.isValid(id);
}

function escapeRegex(lit: string) {
  return lit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseDateOnly(d?: string, endOfDay = false): Date | undefined {
  if (!d) return undefined;
  // oczekujemy formatu YYYY-MM-DD
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m)
    throw new UnprocessableEntityException(
      'Invalid date format (use YYYY-MM-DD)',
    );
  const dt = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0),
  );
  if (endOfDay) {
    dt.setUTCHours(23, 59, 59, 999);
  }
  return dt;
}
@Public()
@Controller('api')
@UseGuards(ApiKeyGuard)
export class OwnerController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    @InjectModel(Transaction.name)
    private readonly txModel: Model<TransactionDocument>,
  ) {}

  @Get('owner/:owner/transactions')
  async listOwnerTransactions(
    @Param('owner') owner: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // 1) resolve owner → user
    let user: any | null = null;

    if (isValidObjectId(owner)) {
      user = await this.userModel.findById(owner).lean();
    } else if (owner.includes('@')) {
      // pełny e-mail, exact (case-insensitive)
      user = await this.userModel
        .findOne({ email: new RegExp(`^${escapeRegex(owner)}$`, 'i') })
        .lean();
    } else {
      // prefiks (z dopuszczeniem plus-addressing)
      const re = new RegExp(`^${escapeRegex(owner)}(\\+.+)?@`, 'i');
      user = await this.userModel.findOne({ email: re }).lean();
    }

    if (!user) {
      throw new NotFoundException('Owner not found');
    }

    // 2) zbierz konta właściciela (userId/ownerId)
    const accounts = await this.accountModel
      .find({
        $or: [
          { userId: user._id?.toString?.() ?? user._id },
          { ownerId: user._id?.toString?.() ?? user._id },
        ],
      })
      .select({ _id: 1 })
      .lean();

    const accIds = accounts.map((a) => a._id as Types.ObjectId);
    if (accIds.length === 0) {
      return { items: [], count: 0 };
    }

    // 3) zakres dat (inclusive)
    const fromDt = parseDateOnly(from, false);
    const toDt = parseDateOnly(to, true);

    const q: any = { accountId: { $in: accIds } };
    if (fromDt || toDt) {
      q.date = {};
      if (fromDt) q.date.$gte = fromDt;
      if (toDt) q.date.$lte = toDt;
    }

    // 4) pobierz transakcje
    const txs = await this.txModel.find(q).sort({ date: -1, _id: -1 }).lean();

    // 5) mapowanie
    const items = txs.map((t: any) => {
      const external =
        t.externalTxnId ?? t.externalId ?? t.external_txn_id ?? null;

      const raw = t.raw ?? t.raw_payload ?? undefined;

      return {
        id: t._id?.toString(),
        externalTxnId: external,
        accountId: t.accountId?.toString?.() ?? String(t.accountId),
        amount: Number(t.amount),
        currency: t.currency || 'PLN',
        date: t.date,
        description: t.description || '',
        ...(raw ? { raw } : {}),
      };
    });

    return { items, count: items.length };
  }
}
