import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoggerService } from 'src/logger/logger.service';
import { JwtModule } from '@nestjs/jwt';
import { PostsModule } from 'src/posts/posts.module';
import { FollowersModule } from 'src/followers/followers.module';

@Module({
    imports:[JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1h' }}), PostsModule, FollowersModule],
  controllers: [CommentsController],
  providers: [CommentsService, PrismaService, UserService, LoggerService],
})
export class CommentsModule {}
