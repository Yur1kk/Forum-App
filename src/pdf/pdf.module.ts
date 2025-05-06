import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { StatisticsService } from '../statistics/statistics.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { PostsService } from 'src/posts/posts.service';
import { UserService } from 'src/user/user.service';
import { ViewService } from 'src/post-views/views.service';
import { LoggerService } from 'src/logger/logger.service';
import { DropboxService } from './dropbox.service';
import { FollowersService } from 'src/followers/followers.service';

@Module({
    imports: [JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),],
  controllers: [PdfController],
  providers: [PdfService, StatisticsService, PrismaService, PostsService, UserService, ViewService, LoggerService, DropboxService, FollowersService],
})
export class PdfModule {}
