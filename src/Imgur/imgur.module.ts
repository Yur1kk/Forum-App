import { Module } from '@nestjs/common';
import { ImgurService } from './imgur.service';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { LoggerService } from 'src/logger/logger.service';
import { ImgurController } from './imgur.controller';
import { JwtModule } from '@nestjs/jwt';
import { PostsService } from 'src/posts/posts.service';
import { ViewModule } from 'src/post-views/views.module';
import { FollowersModule } from 'src/followers/followers.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }), ViewModule, FollowersModule
  ],
  providers: [ImgurService, PrismaService, UserService, LoggerService, PostsService],
  controllers: [ImgurController],
  exports: [ImgurService],
})
export class ImgurModule {}
