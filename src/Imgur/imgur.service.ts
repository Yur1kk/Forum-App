import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as axios from 'axios';
import * as FormData from 'form-data';
import { PrismaService } from 'prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { LoggerService } from 'src/logger/logger.service';
import { PostsService } from 'src/posts/posts.service';

@Injectable()
export class ImgurService {
    constructor(private userService: UserService, private prisma: PrismaService, private loggerService: LoggerService, private postService: PostsService) {}
  async uploadImageToImgur(file: Express.Multer.File): Promise<{ link: string; deletehash: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file buffer found');
    }

    const formData = new FormData();
    formData.append('image', file.buffer, file.originalname);

    try {
      const response = await axios.default.post(process.env.IMGUR_URL, formData, {
        headers: {
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
          ...formData.getHeaders(),
        },
      });
      const { link, deletehash } = response.data?.data;
      if (link && deletehash) {
        return { link, deletehash };
      }
      throw new InternalServerErrorException('Failed to upload image to Imgur');
    } catch (error) {
      throw new InternalServerErrorException('Error uploading to Imgur');
    }
  }

  async addUserPhoto(userId: number, file: Express.Multer.File) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    if (user.profilePhoto) {
      throw new BadRequestException('Profile photo already exists');
    }
  

    const { link: uploadedImageUrl, deletehash } = await this.uploadImageToImgur(file);
  

    await this.userService.uploadUserPhoto(userId, uploadedImageUrl, deletehash);
  
    return { message: 'Profile photo has been added successfully!' };
  }


  async deleteUserPhoto(userId: number) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.profilePhoto || !user.deleteHash) {
      throw new BadRequestException('User does not have a profile photo or deletehash');
    }
  

    await axios.default.delete(`${process.env.IMGUR_DELETE_URL}/image/${user.deleteHash}`, {
      headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` },
    });
  

   await this.userService.deleteUserPhoto(user.id);
  
    return { message: 'Profile photo has been deleted successfully!' };
  }
  
  async updateUserPhoto(userId: number, file: Express.Multer.File) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  

    if (user.profilePhoto && user.deleteHash) {
      await axios.default.delete(`${process.env.IMGUR_DELETE_URL}/image/${user.deleteHash}`, {
        headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` },
      });
    }
  

    const { link: uploadedImageUrl, deletehash } = await this.uploadImageToImgur(file);
  
    await this.userService.updateUserPhoto(userId, uploadedImageUrl, deletehash);
  
    return { message: 'Profile photo has been updated successfully!' };
  }

  async addPostImage(postId: number, file: Express.Multer.File, userId: number) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.postService.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAdmin = user.roleId === 2;
    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to add the image of this post');
    }

    if (post.image) {
      throw new BadRequestException('Post image already exists!');
    }

    const { link: imageUrl, deletehash } = await this.uploadImageToImgur(file);
    await this.postService.uploadPostImage(postId, imageUrl, deletehash);

    await this.loggerService.logAction('Create', userId, 'Post', post.id, post);

    return { message: 'Post image has been added successfully!' };
  }

  async updatePostImage(postId: number, file: Express.Multer.File, userId: number) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.postService.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAdmin = user.roleId === 2;
    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update the image of this post');
    }

    if (post.image && post.deleteHash) {
      await this.deleteImageFromImgur(post.deleteHash);
    }

    const { link: imageUrl, deletehash } = await this.uploadImageToImgur(file);
    await this.postService.updatePostImage(postId, imageUrl, deletehash);

    await this.loggerService.logAction('Update', userId, 'Post', post.id, post);

    return { message: 'Post image has been updated successfully!' };
  }

  async deletePostImage(postId: number, userId: number) {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const post = await this.postService.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const isAdmin = user.roleId === 2;
    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete the image of this post');
    }

    if (!post.image || !post.deleteHash) {
      throw new BadRequestException('There is no image to delete!');
    }

    await this.deleteImageFromImgur(post.deleteHash);

   await this.postService.deletePostImage(post.id);

    await this.loggerService.logAction('Delete', userId, 'Post', post.id, post);

    return { message: 'Post image has been deleted successfully!' };
  }

  private async deleteImageFromImgur(deletehash: string): Promise<void> {
    await axios.default.delete(`${process.env.IMGUR_DELETE_URL}/image/${deletehash}`, {
      headers: { Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}` },
    });
  }

}
