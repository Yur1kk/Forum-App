import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserService } from '../../user/user.service'; 
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../strategies/jwt-auth.guard';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
    imports: [
        JwtModule.register({
          secret: process.env.JWT_SECRET, 
          signOptions: { expiresIn: '1h' }, 
        }),
      PrismaModule],
      controllers: [AdminController],
      providers: [AdminService, UserService, JwtAuthGuard]
})
export class AdminModule {}
