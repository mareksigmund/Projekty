import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('v1/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  /** Zwraca wyłącznie konta zalogowanego użytkownika (JWT). */
  @Get()
  async list(@Req() req: any) {
    const uid: string = req.user.sub;

    const accounts = await this.accountsService.listForUser(uid);
    return accounts.map((a: any) => ({
      id: a._id?.toString(),
      userId: a.userId,
      name: a.name,
      iban: a.iban,
      currency: a.currency,
      balance: a.balance, // grosze
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  }

  /** Tworzy konto dla zalogowanego użytkownika. */
  @Post()
  async create(@Req() req: any, @Body() body: CreateAccountDto) {
    const uid: string = req.user.sub;

    const acc = await this.accountsService.createForUser(uid, {
      name: body.name,
      currency: body.currency, // DTO ogranicza do 'PLN'
      initialBalance: body.initialBalance,
    });

    return acc;
  }
}
