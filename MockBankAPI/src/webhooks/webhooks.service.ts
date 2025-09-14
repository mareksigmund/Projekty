import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Webhook, WebhookDocument } from './schemas/webhook.schema';
import { Model } from 'mongoose';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { CryptoService } from '../common/crypto.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { customAlphabet } from 'nanoid';

const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 16);

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private timeoutMs: number;
  private retrySchedule: number[];
  private userAgent: string;

  constructor(
    @InjectModel(Webhook.name)
    private readonly webhookModel: Model<WebhookDocument>,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
  ) {
    this.timeoutMs = Number(this.config.get('WEBHOOK_TIMEOUT_MS') ?? 5000);
    this.retrySchedule = String(
      this.config.get('WEBHOOK_RETRY_SCHEDULE') ?? '10,30,120',
    )
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    this.userAgent = this.config.get('WEBHOOK_USER_AGENT') ?? 'MockBank/1.0';
  }

  /**
   * Rejestracja webhooka dla KONKRETNEGO klienta (clientId z JWT).
   * Sekret jest szyfrowany w bazie.
   */
  async registerFor(clientId: string, dto: CreateWebhookDto) {
    const secretEnc = this.crypto.encrypt(dto.secret);
    try {
      const created = await this.webhookModel.create({
        clientId,
        url: dto.url,
        secretEnc,
        events: dto.events,
      });
      return this.toDto(created);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException(
          'Webhook already exists for this client and url',
        );
      }
      throw err;
    }
  }

  async listByClient(clientId: string) {
    const items = await this.webhookModel.find({ clientId }).lean();
    return items.map(this.toPlain);
  }

  /** Zwraca pełne dokumenty webhooków (z zaszyfrowanym sekretem) dla klienta */
  async getWebhooksFor(clientId: string, event: string) {
    return this.webhookModel.find({ clientId, events: event }).lean();
  }

  /** Wysyłka eventu `transaction.created` do wszystkich hooków klienta */
  async deliverTransactionCreated(clientId: string, payload: any) {
    const eventType = 'transaction.created';
    const hooks = await this.getWebhooksFor(clientId, eventType);
    if (!hooks.length) {
      this.logger.log(`No webhooks for client=${clientId} event=${eventType}`);
      return;
    }

    const body = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000).toString(); // unix seconds
    const idemp = `evt_${nano()}`;

    await Promise.all(
      hooks.map(async (hook) => {
        const secret = this.crypto.decrypt(hook.secretEnc);
        const signature = this.sign(secret, `${ts}.${body}`);

        await this.postWithRetry(hook.url, body, {
          'Content-Type': 'application/json',
          'User-Agent': this.userAgent,
          'X-MockBank-Timestamp': ts,
          'X-MockBank-Idempotency-Key': idemp,
          'X-MockBank-Signature': `sha256=${signature}`,
        });
      }),
    );
  }

  /** HMAC-SHA256(hex) */
  private sign(secret: string, message: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(message, 'utf8')
      .digest('hex');
  }

  /** POST z timeoutem i retry (5xx/timeout/network) */
  private async postWithRetry(
    url: string,
    body: string,
    headers: Record<string, string>,
  ) {
    let attempt = 0;
    const schedule = [0, ...this.retrySchedule];

    for (const delaySec of schedule) {
      if (delaySec > 0) await this.sleep(delaySec * 1000);
      attempt++;

      try {
        const started = Date.now();
        const res = await axios.post(url, body, {
          headers,
          timeout: this.timeoutMs,
          validateStatus: () => true,
        });
        const latency = Date.now() - started;

        if (res.status >= 200 && res.status < 300) {
          this.logger.log(
            `Webhook delivered to ${url} [${res.status}] in ${latency}ms (attempt ${attempt})`,
          );
          return;
        }

        if (res.status >= 400 && res.status < 500) {
          this.logger.warn(
            `Webhook failed (4xx) ${url} [${res.status}] body=${truncate(body)}`,
          );
          return;
        }

        this.logger.warn(
          `Webhook failed (5xx) ${url} [${res.status}] -> retry if attempts left`,
        );
      } catch (err: any) {
        this.logger.warn(
          `Webhook error to ${url}: ${err?.code || err?.message} -> retry if attempts left`,
        );
      }
    }

    this.logger.error(`Webhook delivery exhausted for ${url}`);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private toDto(doc: WebhookDocument) {
    return this.toPlain(doc.toObject());
  }
  private toPlain(obj: any) {
    return {
      id: obj._id?.toString(),
      clientId: obj.clientId,
      url: obj.url,
      events: obj.events,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  async deleteForClient(
    clientId: string,
    id: string,
  ): Promise<true | false | 'forbidden'> {
    const hook = await this.webhookModel.findById(id).lean();
    if (!hook) return false;
    if (hook.clientId !== clientId) return 'forbidden';
    await this.webhookModel.deleteOne({ _id: id });
    return true;
  }
}

// helper do logów
function truncate(str: string, max = 512) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
