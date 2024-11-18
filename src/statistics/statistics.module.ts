import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PostsService } from 'src/posts/posts.service';
import { LogerModule } from 'src/logger/logger.module';
import { ViewModule } from 'src/post-views/views.module';
import { PdfModule } from 'src/pdf/pdf.module';
import { FollowersService } from 'src/followers/followers.service';

@Module({
  imports: [LogerModule,
    PrismaModule, ViewModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    PdfModule
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService, UserService, PostsService, FollowersService],
})
export class StatisticsModule {}