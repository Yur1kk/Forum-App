import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto'; 
import * as axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: RegisterDto) {
    const { confirmPassword, ...userData } = data;
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { 
        ...userData, 
        password: hashedPassword,
        role: { connect: { id: 1 } } 
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updatePassword(email: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword, resetToken: null },
    });
  }

  async saveResetToken(userId: number, token: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { resetToken: token },
    });
  }

  async findUserByResetToken(token: string) {
    const users = await this.prisma.user.findMany(); 
    return users.find(user => user.resetToken === token);
  }

  async clearResetToken(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { resetToken: null },
    });
  }

  async addUserPhoto(userId: number, file: Express.Multer.File) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingPhoto = user.profilePhoto;
    if (existingPhoto) {
      throw new BadRequestException('Profile photo already exists');
    }

    const uploadedImageUrl = await this.uploadImageToImgur(file);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePhoto: uploadedImageUrl,
      },
    });

    return { message: 'Profile photo has been added successfully!' };
  }

  private async uploadImageToImgur(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new Error('No file buffer found');
    }

    console.log('Uploading file:', file.originalname); 

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

  async deleteUserPhoto(userId: number) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.profilePhoto) {
      throw new BadRequestException('User does not have a profile photo');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
    });

    return { message: 'Profile photo has been deleted successfully!' };
  }

  async updateUserPhoto(userId: number, file: Express.Multer.File) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.profilePhoto) {
      throw new BadRequestException('User does not have a profile photo');
    }

    const uploadedImageUrl = await this.uploadImageToImgur(file);

    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: uploadedImageUrl },
    });

    return { message: 'Profile photo has been updated successfully!' };
  }
}
