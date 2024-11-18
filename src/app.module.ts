import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module'; 
import { UserModule } from './user/user.module'; 
import { PrismaService } from 'prisma/prisma.service';
import { PostsModule } from './posts/posts.module';
import { AdminModule } from './auth/admin/admin.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { StatisticsModule } from './statistics/statistics.module';
import { ImgurModule } from './Imgur/imgur.module';
import { CommentsModule} from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { ViewModule } from './post-views/views.module';
import { PdfModule } from './pdf/pdf.module';
import { FollowersModule } from './followers/followers.module';

@Module({
  imports: [AuthModule, UserModule, PostsModule, AdminModule, StatisticsModule, ImgurModule, LikesModule, CommentsModule, ViewModule, PdfModule, FollowersModule],
  controllers: [AppController],
  providers: [PrismaService, AppService],
})
export class AppModule {}
