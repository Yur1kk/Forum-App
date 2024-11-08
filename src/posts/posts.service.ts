import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { LoggerService } from 'src/logger/logger.service';
import { CreateUserActionLogDto } from 'src/logger/dto/logger.dto';
import * as FormData from 'form-data';
import * as axios from 'axios';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService, private userService: UserService, private jwtService: JwtService, private loggerService: LoggerService) {}


    async createPost(userId: number, createPostDto: CreatePostDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
          throw new NotFoundException('User not found');
        }
    
        const post = await this.prisma.post.create({
          data: {
            title: createPostDto.title,
            content: createPostDto.content,
            published: true,
            authorId: userId,
            categories: {
              create: createPostDto.categoryIds.map((categoryId) => ({
                categoryId: categoryId,
                assignedBy: user.name,
              })),
            },
          },
        });
    
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Create';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = post.id;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
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

        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Delete';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = post.id;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
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
    
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Update';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = post.id;
        logDto.entity = JSON.stringify(updatedPost);
    
        await this.loggerService.logActions(logDto);
        return updatedPost;
      }
    
      async addPostImage(postId: number, file: Express.Multer.File, userId: number) {
        const user = await this.userService.findUserById(userId);

        const post = await this.prisma.post.findUnique({
          where: { id: postId },
        });

        const isAdmin = user.roleId === 2;
        
        if (post.authorId !== userId && !isAdmin) {
            throw new ForbiddenException('You do not have permission to add the image of this post');
          }

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        if(post.image) {
            throw new BadRequestException('Post image already exists!');
        }

        const imageUrl = await this.uploadImageToImgur(file);
        await this.prisma.post.update({
          where: { id: postId },
          data: { image: imageUrl },
        });

        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Create';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = post.id;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
        return {message: 'Post image has been added succesfully!'};
      }
    
      async updatePostImage(postId: number, file: Express.Multer.File, userId: number) {
        const user = await this.userService.findUserById(userId);

        const post = await this.prisma.post.findUnique({
          where: { id: postId },
        });

        const isAdmin = user.roleId === 2;

        if (post.authorId !== userId && !isAdmin) {
            throw new ForbiddenException('You do not have permission to update the image of this post');
          }

        if (!post) {
          throw new NotFoundException('Post not found');
        }

    
        const imageUrl = await this.uploadImageToImgur(file);
        await this.prisma.post.update({
          where: { id: postId },
          data: { image: imageUrl },
        });
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Update';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = post.id;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
        return {message: 'Post image has been updated succesfully!'};
      }

      async deletePostImage(postId: number, userId: number) {
        const user = await this.userService.findUserById(userId);

        const post = await this.prisma.post.findUnique({
          where: { id: postId },
        });

        const isAdmin = user.roleId === 2;

        if (post.authorId !== userId && !isAdmin) {
            throw new ForbiddenException('You do not have permission to delete the image of this post');
          }

        if (!post) {
          throw new NotFoundException('Post not found');
        }

        if(post.image === null) {
            throw new BadRequestException('There is no image to delete!');
        }

        await this.prisma.post.update({
            where: {id: postId},
            data: {
                image: null
            }
        });
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Delete';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = post.id;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
        return {message: 'Post image has been deleted succesfully!'};
      }
    
      private async uploadImageToImgur(file: Express.Multer.File): Promise<string> {
        if (!file || !file.buffer) {
          throw new Error('No file buffer found');
        }
    
        const formData = new FormData();
        formData.append('image', file.buffer, file.originalname);
    
        const response = await axios.default.post(process.env.IMGUR_URL, formData, {
          headers: {
            Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
            ...formData.getHeaders(),
          },
        });
    
        if (response.data?.data?.link) {
          return response.data.data.link;
        } else {
          throw new Error('Failed to upload image to Imgur');
        }
      }

    async getAllPosts(currentUserId: number, targetUserId: number, page: number = 1, limit: number = 10) {
        const user = await this.userService.findUserById(targetUserId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
    
        const skip = (page - 1) * limit;
    
        const posts = await this.prisma.post.findMany({
            where: { published: true, authorId: targetUserId },
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

        for (const post of posts) {
            const logDto = new CreateUserActionLogDto();
            logDto.action = 'Viewed';
            logDto.userId = currentUserId;
            logDto.entityType = 'Post';
            logDto.entityId = post.id;
            logDto.entity = JSON.stringify(post);
        
            await this.loggerService.logActions(logDto);
        };
        return posts;
    }


   async getArchivedPostsByUser(userId: number, targetUserId?: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const user = await this.userService.findUserById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const isAdmin = user.roleId === 2;
    const authorId = isAdmin && targetUserId ? targetUserId : userId;

    const posts = await this.prisma.post.findMany({
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
    for (const post of posts) {
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Viewed';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = post.id;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
    }
    return posts;
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
            
            const logDto = new CreateUserActionLogDto();
            logDto.action = 'Create';
            logDto.userId = userId;
            logDto.entityType = 'Post';
            logDto.entityId = postId;
            logDto.entity = JSON.stringify({postId, userId});
        
            await this.loggerService.logActions(logDto);

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
            const logDto = new CreateUserActionLogDto();
            logDto.action = 'Delete';
            logDto.userId = userId;
            logDto.entityType = 'Post';
            logDto.entityId = postId;
            logDto.entity = JSON.stringify({postId, userId});
        
            await this.loggerService.logActions(logDto);
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
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Create';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = comment.id;
        logDto.entity = JSON.stringify(comment);
    
        await this.loggerService.logActions(logDto);
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
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Delete';
        logDto.userId = userId;
        logDto.entityType = 'Comment';
        logDto.entityId = commentId;
        logDto.entity = JSON.stringify(existingComment);
    
        await this.loggerService.logActions(logDto);
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
            const logDto = new CreateUserActionLogDto();
            logDto.action = 'Viewed';
            logDto.userId = userId;
            logDto.entityType = 'Comment';
            logDto.entityId = comment.id;
            logDto.entity = JSON.stringify(comment);
        
            await this.loggerService.logActions(logDto);
        }
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

        const archivedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { published: false },
        });
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Update';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = postId;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
        return archivedPost;
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

        const unarchivedPost = await this.prisma.post.update({
            where: { id: postId },
            data: { published: true }, 
        });
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Update';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = postId;
        logDto.entity = JSON.stringify(post);
    
        await this.loggerService.logActions(logDto);
        return unarchivedPost;
    }

    async filterPosts(userId: number, filters: { 
        categoryId?: number; 
        searchPhrase?: string;
      }, page: number = 1, limit: number = 10, orderBy: 'asc' | 'desc' = 'desc') {
        const skip = (page - 1) * limit;

      const filteredPosts = await this.prisma.post.findMany({
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
      for (const filteredPost of filteredPosts) {
        const logDto = new CreateUserActionLogDto();
        logDto.action = 'Viewed';
        logDto.userId = userId;
        logDto.entityType = 'Post';
        logDto.entityId = filteredPost.id;
        logDto.entity = JSON.stringify({ filters, page, limit, orderBy });
    
        await this.loggerService.logActions(logDto);
      }
      return filteredPosts;
    }
}