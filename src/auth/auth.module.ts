import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PrismaModule } from 'prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './strategies/jwt-auth.guard'; 
import { MailService } from '../mail/mail.service';
import * as dotenv from 'dotenv';



@Module({
  imports: [
    MailModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
      signOptions: { expiresIn: '1h' }, 
    }),
  ],
  providers: [AuthService, UserService, MailService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}

