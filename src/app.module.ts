import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module'; 
import { UserModule } from './user/user.module'; 
import { PrismaService } from 'prisma/prisma.service';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './auth/admin/admin.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [AuthModule, UserModule, PostsModule, AdminModule, StatisticsModule],
  controllers: [AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {}
