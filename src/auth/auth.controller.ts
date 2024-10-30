import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('request-password-reset')
  async requestPasswordReset(@Req() request: Request & { user: User }) {
    const email = request.user.email; 
    return this.authService.requestPasswordReset(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto, @Req() request: Request) {
    const token = request.query.token as string; 
    return this.authService.resetPassword(body.newPassword, token);
  }  
}
