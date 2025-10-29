import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from './auth/public.decorator';

@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly conn: Connection) {}
  @Public()
  @Get('healthz')
  health() {
    return {
      status: 'ok',
      mongo: this.conn.readyState === 1 ? 'ok' : 'not-connected',
    };
  }
  @Public()
  @Get('readyz')
  ready() {
    return {
      status: this.conn.readyState === 1 ? 'ok' : 'not-ready',
      timestamp: new Date().toISOString(),
    };
  }
}
