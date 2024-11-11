import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private loggerService: LoggerService
  ) {}

  async toggleLikePost(userId: number, postId: number) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingLike = await this.prisma.likes.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.likes.delete({
        where: {
          postId_userId: {
            postId: postId,
            userId: userId,
          },
        },
      });

      await this.updateLikeCount(postId, false);

      await this.loggerService.logAction('Delete', userId, 'Post', postId, { postId, userId });
      return { message: 'Like has been removed successfully!' };
    } else {
      await this.prisma.likes.create({
        data: {
          postId: postId,
          userId: userId,
        },
      });

      await this.updateLikeCount(postId, true);

      await this.loggerService.logAction('Create', userId, 'Post', postId, { postId, userId });
      return { message: 'Like has been added successfully!' };
    }
  }

  private async updateLikeCount(postId: number, increment: boolean) {
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        likesCount: increment ? { increment: 1 } : { decrement: 1 },
      },
    });
  }
}
