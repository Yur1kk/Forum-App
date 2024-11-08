import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto'; 

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

  
}
