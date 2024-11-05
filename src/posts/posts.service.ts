import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService, private userService: UserService, private jwtService: JwtService) {}


    async createPost(userId: number, createPostDto: CreatePostDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const post = await this.prisma.post.create({
            data: {
                title: createPostDto.title,
                content: createPostDto.content,
                image: createPostDto.image,
                published: true,
                authorId: userId,
                categories: {
                    create: createPostDto.categoryIds.map((categoryId) => ({
                        categoryId: categoryId,
                        assignedBy: user.name
                    })),
            },
        },
        });
        return post;
    }

    async deletePost(userId: number, postId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (post.authorId !== userId && user.roleId !== 2) {
            throw new ForbiddenException('You do not have permission to delete this post');
        }

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        await this.prisma.post.delete({
            where: { id: postId },
        });
        return { message: 'Post has been deleted successfully!' };
    }

    async updatePost(userId: number, postId: number, updatePostDto: UpdatePostDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });
    
        if (!post) {
            throw new NotFoundException('Post not found');
        }
    
        if (post.authorId !== userId && user.roleId !== 2) {
            throw new ForbiddenException('You do not have permission to update this post');
        }
    
        const updatedPost = await this.prisma.$transaction(async (prisma) => {
            const postUpdate = await prisma.post.update({
                where: { id: postId },
                data: {
                    title: updatePostDto.title ?? post.title,
                    content: updatePostDto.content ?? post.content,
                    image: updatePostDto.image ?? post.image,
                    published: updatePostDto.published ?? post.published,
                },
                include: {
                    categories: true,
                },
            });
    
            if (updatePostDto.categoryIds) {
                await prisma.postCategories.deleteMany({
                    where: { postId: postId },
                });
    
                const categoryData = updatePostDto.categoryIds.map((categoryId) => ({
                    postId: postId,
                    categoryId: categoryId,
                    assignedBy: user.name || 'unknown', 
                }));
    
                await prisma.postCategories.createMany({
                    data: categoryData,
                });
            }
    
            return postUpdate;
        });
    
        return updatedPost;
    }

    async getAllPosts(userId: number, page: number = 1, limit: number = 10) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        const skip = (page - 1) * limit;
    
        return await this.prisma.post.findMany({
            where: { published: true },
            skip: skip,
            take: limit,
            select: {
                id: true,
                title: true,
                content: true,
                image: true,
                likesCount: true,
                commentsCount: true,
                author: {
                    select: {
                        name: true,
                        profilePhoto: true,
                    },
                },
            },
        });
    }


   async getArchivedPostsByUser(userId: number, targetUserId?: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const user = await this.userService.findUserById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const isAdmin = user.roleId === 2;
    const authorId = isAdmin && targetUserId ? targetUserId : userId;

    return await this.prisma.post.findMany({
        where: {
            authorId: authorId,
            published: false,
        },
        skip: skip,
        take: limit,
        select: {
            id: true,
            title: true,
            content: true,
            image: true,
            likesCount: true,
            commentsCount: true,
            author: {
                select: {
                    name: true,
                    profilePhoto: true,
                },
            },
        },
    });
}
 
    
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
    
            await this.prisma.post.update({
                where: { id: postId },
                data: {
                    likesCount: { decrement: 1 }
                },
            });
            return { message: 'Like has been removed successfully!' };
        } else {
            await this.prisma.likes.create({
                data: {
                    postId: postId,
                    userId: userId,
                },
            });
    
            await this.prisma.post.update({
                where: { id: postId },
                data: {
                    likesCount: { increment: 1 }
                },
            });
            return { message: 'Like has been added successfully!' };
        }
    }
    
    async commentPost(userId: number, postId: number, content: string) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        const post = await this.prisma.post.findUnique({
            where: { id: postId }
        });
    
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
    
        await this.prisma.post.update({
            where: { id: postId },
            data: {
                commentsCount: { increment: 1 },
            },
        });
    
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
    
        const post = await this.prisma.post.findUnique({
            where: { id: existingComment.postId }
        });
    
        if (!post) {
            throw new NotFoundException('Post not found');
        }
    
        if (existingComment.userId !== userId && post.authorId !== userId && user.roleId !== 2) {
            throw new ForbiddenException('You do not have permission to delete this comment');
        }
    
        await this.prisma.comments.delete({
            where: { id: commentId }
        });
    
        await this.prisma.post.update({
            where: { id: existingComment.postId },
            data: {
                commentsCount: { decrement: 1 },
            },
        });
    
        return { message: 'Comment has been deleted successfully!' };
    }
    

    async getAllComments(userId: number, postId: number, page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }
        const comments =  await this.prisma.comments.findMany({
            where: {postId: postId},
            skip: skip,
            take: limit,
            select: {
                content: true,
                commentedAt: true,
                user: {
                    select: {
                        name:true,
                        profilePhoto:true
                    },
                },
            },
        });
        return comments;
    }
    async archivePost(userId: number, postId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId !== userId && user.roleId !== 2) {
            throw new ForbiddenException('You do not have permission to archive this post');
        }

        return await this.prisma.post.update({
            where: { id: postId },
            data: { published: false },
        });
    }

    async unarchivePost(userId: number, postId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const post = await this.prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId !== userId && user.roleId !== 2) { 
            throw new ForbiddenException('You do not have permission to unarchive this post');
        }

        return await this.prisma.post.update({
            where: { id: postId },
            data: { published: true }, 
        });
    }

    async filterPosts(userId: number, filters: { 
        categoryId?: number; 
        searchPhrase?: string;
      }, page: number = 1, limit: number = 10, orderBy: 'asc' | 'desc' = 'desc') {
        const skip = (page - 1) * limit;

      return this.prisma.post.findMany({
        where: {
          ...(filters.categoryId && {
            categories: {
              some: {
                categoryId: filters.categoryId,
              },
            },
          }),
          ...(filters.searchPhrase && {
            OR: [
              { title: { contains: filters.searchPhrase, mode: 'insensitive' } },
              { content: { contains: filters.searchPhrase, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy: [
          {updatedAt: orderBy},
          {createdAt: orderBy},
        ],
        skip: skip,
        take: limit,
      });
    }
}