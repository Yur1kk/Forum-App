import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import { ResetPasswordDto } from './dto/reset-password.dto';

dotenv.config();

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService, private mailService: MailService) {}

  async register(registerDto: RegisterDto) {
    const user = await this.userService.findUserByEmail(registerDto.email);
    if (user) {
      throw new BadRequestException('User with this e-mail is already registered!');
    }
    return this.userService.createUser(registerDto);
  }

  async login(loginDto: LoginDto) {
    const user = await this.userService.findUserByEmail(loginDto.email);
    if (!user) {
      throw new NotFoundException('E-mail does not exist!');
    }

    const isPasswordMatching = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordMatching) {
      throw new BadRequestException('Passwords do not match!');
    }
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User with this email does not exist!');
    }

    const resetToken = uuidv4();
    await this.userService.saveResetToken(user.id, resetToken);

    const resetLink = `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}&email=${email}`;
    
    await this.mailService.sendEmail(
      user.email,
      'Password Reset Request',
      `You requested to reset your password. Click the link to reset it: ${resetLink}`
    );

    return { message: 'Password reset email sent.' };
  }

  async resetPassword(newPassword: string, token: string, resetPasswordDto: ResetPasswordDto) {
    const user = await this.userService.findUserByResetToken(token);
    if (!user) {
        throw new NotFoundException('Invalid or expired reset token.');
    }

    await this.userService.updatePassword(user.email, newPassword);
    await this.userService.clearResetToken(user.id); 

    return { message: 'Password has been reset successfully.' };
}
}
