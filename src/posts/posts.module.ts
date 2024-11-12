import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoggerService } from 'src/logger/logger.service';
import { ViewModule } from 'src/post-views/views.module';
import { ViewService } from 'src/post-views/views.service';

@Module({
  imports: [
    PrismaModule,
    ViewModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService, UserService, LoggerService],
  exports: [PostsService]
})
export class PostsModule {}