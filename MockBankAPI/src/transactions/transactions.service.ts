import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import { Model, FilterQuery, Types } from 'mongoose';
import { customAlphabet } from 'nanoid';
import { WebhooksService } from '../webhooks/webhooks.service';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly txModel: Model<TransactionDocument>,
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
    private readonly webhooks: WebhooksService,
  ) {}

  /**
   * Lista transakcji dla konta, które należy do konkretnego usera.
   * Gdy konto nie istnieje lub nie należy do usera → 403/404.
   */
  async listByAccount(
    accountId: string,
    userId: string,
    opts: { from?: Date; to?: Date; page: number; limit: number },
  ) {
    if (!Types.ObjectId.isValid(accountId)) {
      // traktujemy jak puste (albo możesz rzucić 404)
      return {
        items: [],
        page: 1,
        limit: opts.limit ?? 20,
        total: 0,
        pages: 0,
      };
    }

    // 1) weryfikacja własności konta
    const account = await this.accountModel
      .findOne({ _id: accountId, userId })
      .lean();
    if (!account) {
      // konto nie istnieje albo nie należy do tego usera
      throw new ForbiddenException('You do not have access to this account');
    }

    // 2) query transakcji
    const query: FilterQuery<TransactionDocument> = {
      accountId: new Types.ObjectId(accountId),
    };
    if (opts.from || opts.to) {
      query.date = {};
      if (opts.from) query.date.$gte = opts.from;
      if (opts.to) query.date.$lte = opts.to;
    }

    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.txModel
        .find(query)
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.txModel.countDocuments(query),
    ]);

    return {
      items: items.map((t: any) => ({
        id: t._id?.toString(),
        accountId: t.accountId?.toString(),
        amount: t.amount,
        currency: t.currency,
        date: t.date,
        description: t.description,
        counterparty: t.counterparty,
        categoryHint: t.categoryHint,
        externalTxnId: t.externalTxnId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Tworzy transakcję na koncie usera (weryfikacja właściciela),
   * aktualizuje saldo i wysyła webhook.
   */
  async simulateCreate(input: {
    accountId: string;
    userId: string;
    amount: number;
    description: string;
    counterparty?: string;
    categoryHint?: string;
    date?: Date;
  }) {
    // 1) sprawdzamy konto + własność
    const account = await this.accountModel
      .findOne({ _id: input.accountId, userId: input.userId })
      .lean();
    if (!account) {
      throw new ForbiddenException('You do not have access to this account');
    }

    // 2) dane transakcji
    const externalTxnId = `tx_${nano()}`;
    const when = input.date ?? new Date();

    // 3) zapis transakcji
    const created = await this.txModel.create({
      accountId: new Types.ObjectId(input.accountId),
      amount: input.amount,
      currency: account.currency,
      date: when,
      description: input.description,
      counterparty: input.counterparty,
      categoryHint: input.categoryHint,
      externalTxnId,
      raw: { source: 'simulator' },
    });

    // 4) aktualizacja salda
    await this.accountModel.updateOne(
      { _id: account._id },
      { $inc: { balance: input.amount } },
    );

    // 5) webhook do hooków TEGO usera
    const eventPayload = {
      type: 'transaction.created',
      id: `evt_${nano()}`,
      createdAt: new Date().toISOString(),
      data: {
        externalTxnId: created.externalTxnId,
        accountId: created.accountId.toString(),
        amount: created.amount,
        currency: created.currency,
        date: created.date.toISOString(),
        description: created.description,
        counterparty: created.counterparty,
        categoryHint: created.categoryHint,
        raw: { source: 'simulator' },
      },
    };
    await this.webhooks.deliverTransactionCreated(account.userId, eventPayload);

    return {
      id: created._id.toString(),
      accountId: created.accountId.toString(),
      amount: created.amount,
      currency: created.currency,
      date: created.date,
      description: created.description,
      counterparty: created.counterparty,
      categoryHint: created.categoryHint,
      externalTxnId: created.externalTxnId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }
}
