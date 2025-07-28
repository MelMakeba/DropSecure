import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify_email.dto';
import { ResetPasswordDto } from './dto/reset_password.dto';
import { ApiResponseService } from '../shared/api-response.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiResponse: ApiResponseService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return this.apiResponse.success(result, 'Registration successful');
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return this.apiResponse.success(result, 'Login successful');
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return this.apiResponse.success(result, 'Token refreshed');
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return this.apiResponse.success(result, 'Email verified');
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    const result = await this.authService.requestPasswordReset(email);
    return this.apiResponse.success(result, 'Password reset code sent');
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return this.apiResponse.success(result, 'Password reset successful');
  }
}
