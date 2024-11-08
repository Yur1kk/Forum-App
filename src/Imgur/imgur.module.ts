import { Module } from '@nestjs/common';
import { ImgurService } from './imgur.service';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { LoggerService } from 'src/logger/logger.service';
import { ImgurController } from './imgur.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ImgurService, PrismaService, UserService, LoggerService],
  controllers: [ImgurController],
  exports: [ImgurService],
})
export class ImgurModule {}
