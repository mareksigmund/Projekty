import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly allow: string[];

  constructor(private readonly config: ConfigService) {
    const raw =
      this.config.get<string>('API_KEY') ||
      this.config.get<string>('API_KEYS') ||
      '';
    this.allow = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { headers: any }>();
    const h = String(req.headers?.authorization || '');
    const m = h.match(/^Bearer\s+(.+)$/i);
    const token = m?.[1] || '';
    if (!token || (this.allow.length > 0 && !this.allow.includes(token))) {
      throw new UnauthorizedException('Unauthorized');
    }
    return true;
  }
}
