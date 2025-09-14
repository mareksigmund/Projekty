import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { Model } from 'mongoose';
import { customAlphabet } from 'nanoid';

const nano = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

@Injectable()
export class AccountsService implements OnModuleInit {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

  /**
   * Opcjonalny seed konta demo — tylko w DEV i gdy SEED_DEMO_ACCOUNTS=true.
   * Na produkcji nigdy nie tworzymy danych testowych.
   */
  async onModuleInit() {
    const isProd = process.env.NODE_ENV === 'production';
    const wantSeed =
      (process.env.SEED_DEMO_ACCOUNTS || '').toLowerCase() === 'true';
    if (!isProd && wantSeed) {
      await this.ensureDemoAccount();
    }
  }

  private async ensureDemoAccount() {
    const userId = 'demo-user-1';
    const iban = 'PL61109010140000071219812874';
    const existing = await this.accountModel.findOne({ userId, iban }).lean();
    if (existing) return;
    await this.accountModel.create({
      userId,
      name: 'Konto PLN (demo)',
      iban,
      currency: 'PLN',
      balance: 100_000, // 1000.00 PLN
    });
    this.logger.log(`Demo account created for ${userId}.`);
  }

  /** Lista kont konkretnego użytkownika. */
  async listForUser(userId: string) {
    return this.accountModel.find({ userId }).sort({ createdAt: 1 }).lean();
  }

  /**
   * Tworzy konto dla użytkownika (MVP: walidacja DTO ogranicza do 'PLN').
   * IBAN generujemy po stronie serwera (pseudo-IBAN, unikalny w instancji).
   */
  async createForUser(
    userId: string,
    input: { name: string; currency: string; initialBalance?: number },
  ) {
    const iban = this.generateIbanLike();

    try {
      const created = await this.accountModel.create({
        userId,
        name: input.name,
        iban,
        currency: input.currency, // DTO pilnuje wartości
        balance: input.initialBalance ?? 0,
      });

      return {
        id: created._id.toString(),
        userId: created.userId,
        name: created.name,
        iban: created.iban,
        currency: created.currency,
        balance: created.balance,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException('Account with this IBAN already exists');
      }
      throw err;
    }
  }

  /**
   * Helper (np. do transakcji):
   * Zwraca konto, jeśli należy do usera, w przeciwnym razie null.
   */
  async findOwnedAccount(accountId: string, userId: string) {
    return this.accountModel.findOne({ _id: accountId, userId }).lean();
  }

  /** Pseudo-IBAN — tylko do demo. */
  private generateIbanLike() {
    return `PL00MOCK${nano()}`;
  }
}
