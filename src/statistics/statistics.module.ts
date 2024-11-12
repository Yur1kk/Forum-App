import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PostsService } from 'src/posts/posts.service';
import { LogerModule } from 'src/logger/logger.module';
import { ViewModule } from 'src/post-views/views.module';

@Module({
  imports: [LogerModule,
    PrismaModule, ViewModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService, UserService, PostsService],
})
export class StatisticsModule {}