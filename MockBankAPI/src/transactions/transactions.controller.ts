import { Controller, Get, Param, Post, Query, Body, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { SimulateTransactionDto } from './dto/simulate-transaction.dto';

@Controller()
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get('v1/accounts/:accountId/transactions')
  async list(
    @Req() req: any,
    @Param('accountId') accountId: string,
    @Query() query: ListTransactionsDto,
  ) {
    const userId: string = req.user.sub;
    const { from, to, page = 1, limit = 20 } = query;
    return this.txService.listByAccount(accountId, userId, {
      from,
      to,
      page,
      limit,
    });
  }

  @Post('v1/simulations/transaction')
  async simulate(@Req() req: any, @Body() body: SimulateTransactionDto) {
    const userId: string = req.user.sub;
    return this.txService.simulateCreate({
      accountId: body.accountId,
      userId,
      amount: body.amount,
      description: body.description,
      counterparty: body.counterparty,
      categoryHint: body.categoryHint,
      date: body.date,
    });
  }
}
