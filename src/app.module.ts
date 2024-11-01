import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module'; 
import { UserModule } from './user/user.module'; 
import { PrismaService } from 'prisma/prisma.service';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './auth/admin/admin.module';

@Module({
  imports: [AuthModule, UserModule, PostsModule, AdminModule],
  providers: [PrismaService],
})
export class AppModule {}
