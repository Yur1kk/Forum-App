import { Injectable, NotFoundException, ForbiddenException} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { LoggerService } from 'src/logger/logger.service';
import { ViewService } from '../post-views/views.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService, private viewService: ViewService, private userService: UserService, private loggerService: LoggerService) {}

    private async createPostEntry(userId: number, createPostDto: CreatePostDto) {
        return this.prisma.post.create({
            data: {
              title: createPostDto.title,
              content: createPostDto.content,
              published: true,
              authorId: userId,
              categories: {
                create: createPostDto.categoryIds.map((categoryId) => ({
                  categoryId,
                  assignedBy: 'User',
                })),
              },
            },
          });
    }

    private async updatePostEntry(postId: number, updatePostDto: UpdatePostDto, userName: string) {
        return this.prisma.$transaction(async (prisma) => {
          const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: {
              title: updatePostDto.title ?? undefined,
              content: updatePostDto.content ?? undefined,
              published: updatePostDto.published ?? undefined,
            },
          });
    
          if (updatePostDto.categoryIds) {
            await prisma.postCategories.deleteMany({ where: { postId } });
            await prisma.postCategories.createMany({
              data: updatePostDto.categoryIds.map((categoryId) => ({
                postId,
                categoryId,
                assignedBy: userName,
              })),
            });
          }
    
          return updatedPost;
        });
      }
    
      private async deletePostEntry(postId: number) {
        return this.prisma.post.delete({ where: { id: postId } });
      }

      private async findPostsWithFilters(filters, page, limit, orderBy, includeAuthor = true) {
        const skip = (page - 1) * limit;
        return this.prisma.post.findMany({
            where: filters,
            orderBy: [
                { updatedAt: orderBy },
                { createdAt: orderBy },
            ],
            skip,
            take: limit,
            include: includeAuthor ? { author: { select: { name: true, profilePhoto: true } } } : undefined,
        });
    }

    private async updateArchivedStatus(postId: number, isPublished: boolean) {
        await this.prisma.post.update({
            where: { id: postId },
            data: {
                published: isPublished
            }
        });
    }

    async createPost(userId: number, createPostDto: CreatePostDto) {
        const user = await this.userService.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');

    const post = await this.createPostEntry(userId, createPostDto);
    await this.loggerService.logAction('Create', userId, 'Post', post.id, post);
    return post;
      }

      async getPost(userId: number, postId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) throw new NotFoundException('User not found');
    
        const post = await this.prisma.post.findUnique({
            where: { id: postId },
            include: {
                comments: true,
            }
        });
    
        if (!post) throw new NotFoundException('Post not found');
    
        const viewCount = await this.viewService.countView(user, post);
    
        await this.loggerService.logAction('Viewed', userId, 'Post', postId, post);
    
        return {
            ...post,
            likeCount: post.likesCount,
            viewCount, 
            commentCount: post.commentsCount,
        };
    }
    
    
    
    async deletePost(userId: number, postId: number) {
        const user = await this.userService.findUserById(userId);
    if (!user) throw new NotFoundException('User not found');

    const post = await this.findPostById(postId);
    if (post.authorId !== userId && user.roleId !== 2) throw new ForbiddenException('You do not have permission to delete this post');

    await this.deletePostEntry(postId);
    await this.loggerService.logAction('Delete', userId, 'Post', postId, post);
    return { message: 'Post has been deleted successfully!' };
    }

    async updatePost(userId: number, postId: number, updatePostDto: UpdatePostDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) throw new NotFoundException('User not found');
    
        const post = await this.findPostById(postId);
        if (post.authorId !== userId && user.roleId !== 2) throw new ForbiddenException('You do not have permission to update this post');
    
        const updatedPost = await this.updatePostEntry(postId, updatePostDto, user.name);
        await this.loggerService.logAction('Update', userId, 'Post', postId, updatedPost);
        return updatedPost;
      }
    
      async getAllPosts(
        currentUserId: number, 
        targetUserId: number, 
        page: number = 1, 
        limit: number = 10
    ) {
        const filters: any = { published: true };
    
        if (targetUserId) {
            filters.authorId = targetUserId;
        }
    
        const posts = await this.findPostsWithFilters(filters, page, limit, 'desc');
    
        const result = await Promise.all(posts.map(async (post) => {
            const likesCount = await this.prisma.likes.count({ where: { postId: post.id } });
            const commentsCount = await this.prisma.comments.count({ where: { postId: post.id } });
    
            await this.loggerService.logAction('Viewed', currentUserId, 'Post', post.id, post);
    
            return {
                id: post.id,
                title: post.title,
                content: post.content,
                image: post.image,
                published: post.published,
                likesCount,
                commentsCount,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
            };
        }));
    
        return result;
    }
    
      


   async getArchivedPostsByUser(userId: number, targetUserId?: number, page: number = 1, limit: number = 10) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    const isAdmin = user.roleId === 2;
    const authorId = isAdmin && targetUserId ? targetUserId : userId;

    const posts = await this.findPostsWithFilters(
        { authorId, published: false },
        page,
        limit,
        'desc'
    );
    for (const post of posts) {
        await this.loggerService.logAction('Viewed', userId, 'Post', post.id, post);
    }
    return posts;
}

    async archivePost(userId: number, postId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const post = await this.findPostById(postId);

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId !== userId && user.roleId !== 2) {
            throw new ForbiddenException('You do not have permission to archive this post');
        }

        const archivedPost = await this.updateArchivedStatus(postId, false);

        await this.loggerService.logAction('Update', userId, 'Post', postId, post);
        return archivedPost;
    }

    async unarchivePost(userId: number, postId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const post = await this.findPostById(postId);

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.authorId !== userId && user.roleId !== 2) { 
            throw new ForbiddenException('You do not have permission to unarchive this post');
        }

        const unarchivedPost = await this.updateArchivedStatus(postId, true);
        await this.loggerService.logAction('Update', userId, 'Post', postId, post);
        return unarchivedPost;
    }

    async filterPosts(userId: number, filters: { 
        categoryId?: number; 
        searchPhrase?: string;
      }, page: number = 1, limit: number = 10, orderBy: 'asc' | 'desc' = 'desc') {

        const where = {
            published: true,
            ...(filters.categoryId && {
                categories: { some: { categoryId: filters.categoryId } },
            }),
            ...(filters.searchPhrase && {
                OR: [
                    { title: { contains: filters.searchPhrase, mode: 'insensitive' } },
                    { content: { contains: filters.searchPhrase, mode: 'insensitive' } },
                ],
            }),
        };

        const filteredPosts = await this.findPostsWithFilters(where, page, limit, orderBy, false);
      for (const filteredPost of filteredPosts) {  
        await this.loggerService.logAction('Viewed', userId, 'Post', filteredPost.id, { filters, page, limit, orderBy });
      }
      return filteredPosts;
    }

    async findPostById(id: number) {
       return this.prisma.post.findUnique({ where: { id } });
    }

    async uploadPostImage(postId: number, imageUrl: string, deleteHash: string) {
        return this.prisma.post.update({
            where: { id: postId },
            data: { image: imageUrl, deleteHash: deleteHash },
          });
    }

    async deletePostImage(postId: number) {
       return this.prisma.post.update({
        where: { id: postId },
        data: { image: null, deleteHash: null },
      });
    }

    async updatePostImage(postId: number, imageUrl: string, deleteHash: string) {
        return this.prisma.post.update({
            where: { id: postId },
            data: { image: imageUrl, deleteHash: deleteHash },
          });
    }
}