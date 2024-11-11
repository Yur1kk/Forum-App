import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterAdminDto } from './dto/admin-register.dto';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { UserService } from 'src/user/user.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PostsService } from 'src/posts/posts.service';

dotenv.config();

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: UserService,
    private postService: PostsService
  ) {}
  async registerAdmin(registerAdminDto: RegisterAdminDto, userId: number) {
    const user = await this.userService.findUserById(userId);
  
    if (!user || user.roleId !== 2) {
      throw new NotFoundException();
    }
  
    if (registerAdminDto.adminPassword !== process.env.ADMIN_PASSWORD) {
      throw new NotFoundException('Invalid admin password!');
    }
  
    const newAdmin = await this.createAdmin(registerAdminDto);
    
    const token = this.jwtService.sign({ sub: newAdmin.id, roleId: newAdmin.roleId });
  
    return { newAdmin, token }; 
  }
  

  async createAdmin(data: RegisterAdminDto) {
    const { confirmPassword, adminPassword, ...userData } = data; 
  
    if (data.password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match!');
    }

    const existingUser = await this.userService.findUserByEmail(userData.email);
    
      if (existingUser) {
        throw new BadRequestException('User or Admin with this email already exists');
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
      throw new NotFoundException();
    }
    const user = await this.userService.findUserById(userId);

    if(user.roleId === 2) {
      throw new BadRequestException('User has admin role. Deletion prevented!')
    }

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
      throw new NotFoundException();
    }

    if (adminPass !== process.env.ADMIN_PASSWORD) {
      throw new NotFoundException('Invalid admin password!');
  }

    
    if (adminToDelete.roleId !== 2) {
      throw new BadRequestException('User that you want to delete is not admin. Deletion prevented!');
    }

    if (!adminToDelete) {
      throw new NotFoundException('Admin not found!');
    }

    await this.prisma.user.delete({
      where: {id : adminToDeleteId},
    });

    return {message: 'Admin has been deleted succesfully!'};
  }

  async createCategory(name: string, adminId: number) {
    const admin = await this.userService.findUserById(adminId);

    if (!admin || admin.roleId !== 2) {
      throw new NotFoundException();
    }

    await this.prisma.category.create({
      data: {
        name,
      },
    });

    return {message: 'Category has been created succesfully!'};
  }

  async deleteCategory(adminId: number, postCategoryId: number) {
    const admin = await this.userService.findUserById(adminId);

    if  (!admin || admin.roleId !== 2) {
      throw new NotFoundException();
    }

    const postCategory = await this.prisma.category.findUnique({
      where: {id: postCategoryId},
    });

    if (!postCategory) {
      throw new NotFoundException('Post category not found!');
    }
    await this.prisma.category.delete({
      where: {id: postCategoryId},
    });
    return {message: 'Category has been deleted succesfully!'};
  }

  async updateCategory(adminId: number, postCategoryId: number, createCategoryDto: CreateCategoryDto) {
    const admin = await this.userService.findUserById(adminId);

    if  (!admin || admin.roleId !== 2) {
      throw new NotFoundException();
    }

    const updatedPostCategory = await this.prisma.$transaction(async (prisma) => {
    const postCategory = await prisma.category.findUnique({
      where: {id: postCategoryId},
    });

    if (!postCategory) {
      throw new NotFoundException('Post category not found!');
    }

    return await prisma.category.update({
      where: {id: postCategoryId},
      data: {
        name: createCategoryDto.name,
      },
    });
    
  });
  return {message: 'Category name has been updated succesfully!', updatedPostCategory};
}
}
