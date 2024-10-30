import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaModule } from 'prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './strategies/jwt-auth.guard'; // Додайте цей імпорт
import { MailService } from '../mail/mail.service';
import * as dotenv from 'dotenv';

dotenv.config();
console.log('JWT_SECRET:', process.env.JWT_SECRET); // Логування значення
console.log('Is JWT_SECRET defined?', !!process.env.JWT_SECRET); // Перевірка, чи визначена змінна


@Module({
  imports: [
    MailModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '24h' }, 
    }),
  ],
  providers: [AuthService, UserService, MailService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}

