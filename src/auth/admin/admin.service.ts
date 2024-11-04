import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterAdminDto } from './dto/admin-register.dto';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { UserService } from 'src/user/user.service';

dotenv.config();

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: UserService
  ) {}
  async registerAdmin(registerAdminDto: RegisterAdminDto, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
  
    if (!user || user.roleId !== 2) {
      throw new NotFoundException('Only admins can create new admin users');
    }
  
    if (registerAdminDto.adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new BadRequestException('Invalid admin password');
    }
  
    const newAdmin = await this.createAdmin(registerAdminDto);
    
    const token = this.jwtService.sign({ sub: newAdmin.id, roleId: newAdmin.roleId });
  
    return { newAdmin, token }; 
  }
  

  async createAdmin(data: RegisterAdminDto) {
    const { confirmPassword, adminPassword, ...userData } = data; 
  
    if (data.password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });
    
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }
  
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        role: { connect: { id: 2 } },
      },
    });
  }  

  async deleteUser(adminId: number, userId: number) {
    const admin = await this.userService.findUserById(adminId);
  
    if (!admin || admin.roleId !== 2) {
      throw new NotFoundException('Only admins can delete users');
    }
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    await this.prisma.user.delete({
      where: { id: userId },
  });
  return { message: 'User has been deleted successfully!' };
}

  async deleteAdmin(adminPass: string, adminId: number, adminToDeleteId: number) {
    const admin = await this.userService.findUserById(adminId);
    const adminToDelete = await this.userService.findUserById(adminToDeleteId);

    if (!admin || admin.roleId !== 2) {
      throw new NotFoundException('Only admins can delete admins');
    }

    if (adminPass !== process.env.ADMIN_PASSWORD) {
      throw new BadRequestException('Invalid admin password');
  }

    
    if (adminToDelete.roleId !== 2) {
      throw new BadRequestException('User is not admin');
    }

    if (!adminToDelete) {
      throw new NotFoundException('Admin not found!');
    }

    await this.prisma.user.delete({
      where: {id : adminToDeleteId},
    });

    return {message: 'Admin has been deleted succesfully!'};
  }
}
