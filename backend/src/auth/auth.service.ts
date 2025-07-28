/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify_email.dto';
import { ResetPasswordDto } from './dto/reset_password.dto'; // You need to create this DTO
import { User, UserRole } from '../../generated/prisma';
import { hash, compare } from 'bcryptjs';
import { EmailService } from '../shared/mailer/email.service';
import { addMinutes, isAfter } from 'date-fns';
import { UserService } from '../users/users.service'; // <-- Import your UserService

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private userService: UserService, // <-- Inject UserService
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByEmail(dto.email);
    if (exists) throw new BadRequestException('Email already in use');

    const hashed = await hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashed,
        role: dto.role || UserRole.SENDER,
      },
    });

    // Generate verification code
    const code = this.generateCode();
    const expiresAt = addMinutes(new Date(), 15);

    await this.userService.updateUser(user.id, {
      verificationCode: code,
      verificationExpires: expiresAt,
    });

    // Send verification email
    await this.emailService.sendWelcomeEmail(user.email, {
      name: user.firstName,
      verificationCode: code,
      verifyUrl: '',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
    });

    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is inactive');
    const valid = await compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isEmailVerified)
      throw new UnauthorizedException('Email not verified');
    return this.generateTokens(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) return null;
    const valid = await compare(password, user.password);
    if (!valid) return null;
    return user;
  }

  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '24h',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });
    // Remove password from returned user object
    const { password: _password, ...safeUser } = user;
    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }

  generateCode(): string {
    // Math.random() for a 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new BadRequestException('User not found');
    if (
      !user.verificationCode ||
      !user.verificationExpires ||
      user.verificationCode !== dto.code
    ) {
      throw new BadRequestException('Invalid code');
    }
    if (isAfter(new Date(), user.verificationExpires))
      throw new BadRequestException('Code expired');
    await this.userService.updateUser(user.id, {
      isEmailVerified: true,
      verificationCode: null,
      verificationExpires: null,
    });
    return { message: 'Email verified successfully' };
  }

  async refreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        role: string;
      }>(token);
      const user = await this.userService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    const code = this.generateCode();
    const expiresAt = addMinutes(new Date(), 15);

    await this.userService.updateUser(user.id, {
      passwordResetCode: code,
      passwordResetExpires: expiresAt,
    });

    await this.emailService.sendPasswordResetEmail(user.email, {
      name: user.firstName,
      token: code,
      expiresIn: '15 minutes',
    });

    return { message: 'Password reset code sent to your email.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new BadRequestException('User not found');
    if (
      !user.passwordResetCode ||
      !user.passwordResetExpires ||
      user.passwordResetCode !== dto.code
    ) {
      throw new BadRequestException('Invalid code');
    }
    if (isAfter(new Date(), user.passwordResetExpires))
      throw new BadRequestException('Code expired');

    const hashed = await hash(dto.newPassword, 10);
    await this.userService.updateUser(user.id, {
      password: hashed,
      passwordResetCode: null,
      passwordResetExpires: null,
    });

    return { message: 'Password reset successful. You can now log in.' };
  }
}
