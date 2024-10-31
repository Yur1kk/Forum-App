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
            where: { id: postId},
        });

    if (!post) {
        throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
        throw new ForbiddenException('You do not have permission to delete this post');
    }
    await this.prisma.post.delete({
        where: {id: postId},
    });
    return {message: 'Post has been deleted succesfully!'};
    }

    async updatePost(userId: number, postId: number, updatePostDto: UpdatePostDto) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const post = await this.prisma.post.findUnique({
            where: { id: postId},
        });

    if (!post) {
        throw new NotFoundException('Post not found');
    }

    if (post.authorId !== userId) {
        throw new ForbiddenException('You do not have permission to update this post');
    }
    const updatedPost = await this.prisma.post.update({
        where: {id: postId},
        data: {
            title: updatePostDto.title ?? post.title,
            content: updatePostDto.content ?? post.content,
            image: updatePostDto.image ?? post.image,
            published: updatePostDto.published ?? post.published,
        },
    });
    return updatedPost;
    }

    async getAllPosts(userId: number) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return await this.prisma.post.findMany({
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
}