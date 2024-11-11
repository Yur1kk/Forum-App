import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';
import { PostsService } from 'src/posts/posts.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService, private loggerService: LoggerService, private postService: PostsService, private userService: UserService) {}

  async commentPost(userId: number, postId: number, content: string) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const post = await this.postService.findPostById(postId);

    if (!post) {
        throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comments.create({
        data: {
            postId: postId,
            userId: userId,
            content: content,
        },
    });

    await this.updateCommentCount(postId, true);

    await this.loggerService.logAction('Create', userId, 'Post', comment.id, comment);
    return comment;
}

async deleteComment(userId: number, postId: number, commentId: number) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const existingComment = await this.prisma.comments.findUnique({
        where: { id: commentId },
    });

    if (!existingComment) {
        throw new NotFoundException('Comment not found');
    }

    if (existingComment.postId !== postId) {
        throw new ForbiddenException('Comment does not belong to the specified post');
    }

    const post = await this.postService.findPostById(existingComment.postId);

    if (!post) {
        throw new NotFoundException('Post not found');
    }

    if (existingComment.userId !== userId && post.authorId !== userId && user.roleId !== 2) {
        throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.prisma.comments.delete({
        where: { id: commentId }
    });

    await this.updateCommentCount(postId, false);

    await this.loggerService.logAction('Delete', userId, 'Comment', commentId, existingComment);
    return { message: 'Comment has been deleted successfully!' };
}


async getAllComments(userId: number, postId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const user = await this.userService.findUserById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }
    const post = await this.postService.findPostById(postId);

    if (!post) {
        throw new NotFoundException('Post not found');
    }
    const comments =  await this.prisma.comments.findMany({
        where: {postId: postId},
        skip: skip,
        take: limit,
        select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
                select: {
                    name:true,
                    profilePhoto:true
                },
            },
        },
    });
    
    for (const comment of comments) {      
        await this.loggerService.logAction('Viewed', userId, 'Comment', comment.id, comment);
    }
    return comments;
}

  private async updateCommentCount(postId: number, increment: boolean) {
    await this.prisma.post.update({
      where: { id: postId },
      data: { commentsCount: increment ? { increment: 1 } : { decrement: 1 } },
    });
  }
}
