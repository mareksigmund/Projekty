import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: { email: string; password: string; fullName: string }) {
    const exists = await this.users.findByEmail(input.email);
    if (exists) throw new BadRequestException('Email already registered');
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });
    const user = await this.users.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
    });
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.signTokens(user._id.toString(), user.email);
    await this.saveRefreshHash(user._id.toString(), tokens.refreshToken);
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    // weryfikacja podpisu refresh JWT
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // znajdź usera i porównaj hash
    const user = await this.users.findByEmail(payload.email);
    if (!user || !user.refreshTokenHash)
      throw new UnauthorizedException('Invalid refresh token');

    const match = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!match) throw new UnauthorizedException('Invalid refresh token');

    // rotacja: generujemy nowy komplet i zapisujemy nowy hash
    const tokens = await this.signTokens(user._id.toString(), user.email);
    await this.saveRefreshHash(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
      },
      ...tokens,
    };
  }

  async logout(userId: string) {
    await this.users.clearRefreshHash(userId);
    return { success: true };
  }

  private async signTokens(userId: string, email: string) {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET')!;
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET')!;
    const accessExpires =
      this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m';
    const refreshExpires =
      this.config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: accessSecret, expiresIn: accessExpires },
      ),
      this.jwt.signAsync(
        { sub: userId, email },
        { secret: refreshSecret, expiresIn: refreshExpires },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshHash(userId: string, refreshToken: string) {
    const refreshTokenHash = await argon2.hash(refreshToken, {
      type: argon2.argon2id,
    });
    await this.users.updateRefreshHash(userId, refreshTokenHash);
  }
}
