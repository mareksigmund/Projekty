import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Param,
  Delete,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async register(@Req() req: any, @Body() body: CreateWebhookDto) {
    const clientId: string = req.user.sub;
    return this.webhooksService.registerFor(clientId, body);
  }

  @Get()
  async list(@Req() req: any) {
    const clientId: string = req.user.sub;
    return this.webhooksService.listByClient(clientId);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const clientId: string = req.user.sub;
    const deleted = await this.webhooksService.deleteForClient(clientId, id);
    if (!deleted) throw new NotFoundException('Webhook not found');
    if (deleted === 'forbidden') throw new ForbiddenException();
    return { success: true };
  }
}
