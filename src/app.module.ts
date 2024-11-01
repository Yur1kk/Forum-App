import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module'; 
import { UserModule } from './user/user.module'; 
import { PrismaService } from 'prisma/prisma.service';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [AuthModule, UserModule, PostsModule],
  providers: [PrismaService],
})
export class AppModule {}
