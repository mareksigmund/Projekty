import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.auth.register({
      email: body.email,
      password: body.password,
      fullName: body.fullName,
    });
  }
  @Public()
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }
  @Public()
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.auth.refreshTokens(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    await this.auth.logout(req.user.sub);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return { id: req.user.sub, email: req.user.email };
  }
}
