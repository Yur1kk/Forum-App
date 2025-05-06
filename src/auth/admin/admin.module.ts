import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UserService } from '../../user/user.service'; 
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../strategies/jwt-auth.guard';
import { PrismaModule } from 'prisma/prisma.module';
import { LogerModule } from 'src/logger/logger.module';
import { PostsModule } from 'src/posts/posts.module';
import { FollowersModule } from 'src/followers/followers.module';

@Module({
    imports: [LogerModule, PostsModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET, 
          signOptions: { expiresIn: '1h' },  
        }), FollowersModule,
      PrismaModule],
      controllers: [AdminController],
      providers: [AdminService, UserService, JwtAuthGuard]
})
export class AdminModule {}
