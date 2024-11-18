import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoggerService } from 'src/logger/logger.service';
import { ViewModule } from 'src/post-views/views.module';
import { PdfModule } from 'src/pdf/pdf.module';
import { FollowersModule } from 'src/followers/followers.module';

@Module({
  imports: [ PdfModule,
    PrismaModule,
    ViewModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }), FollowersModule
  ],
  controllers: [PostsController],
  providers: [PostsService, UserService, LoggerService],
  exports: [PostsService]
})
export class PostsModule {}