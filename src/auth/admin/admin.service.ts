import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterAdminDto } from './dto/admin-register.dto';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerAdmin(registerAdminDto: RegisterAdminDto, userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
  
    if (!user || user.roleId !== 2) {
      throw new BadRequestException('Only admins can create new admin users');
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
}
