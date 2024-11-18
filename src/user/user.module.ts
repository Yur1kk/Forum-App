import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from '../../prisma/prisma.module'; 
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { PostsService } from 'src/posts/posts.service';
import { FollowersService } from 'src/followers/followers.service';
import { ViewService } from 'src/post-views/views.service';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  imports: [PrismaModule, AuthModule, JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1h' },
  })], 
  providers: [UserService, PostsService, FollowersService, ViewService, LoggerService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
