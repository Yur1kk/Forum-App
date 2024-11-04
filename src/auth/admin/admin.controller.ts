import { Controller, Post, Body, Request, UseGuards, BadRequestException, Param, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../strategies/jwt-auth.guard';
import { RegisterAdminDto } from './dto/admin-register.dto';
import { AdminPasswordDto } from './dto/admin-password.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('register-admin')
  async registerAdmin(@Body() registerAdminDto: RegisterAdminDto, @Request() req) {
    return this.adminService.registerAdmin(registerAdminDto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-user/:id')
  async deleteUser(@Request() req, @Param('id') userId: string) {
   const parsedUserId = parseInt(userId, 10)
    return this.adminService.deleteUser(req.user.sub, parsedUserId)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-admin/:id') 
  async deleteAdmin(@Request() req, @Param('id') adminToDeleteId: string, @Body() adminPasswordDto: AdminPasswordDto) {
    const parsedAdminToDeleteId = parseInt(adminToDeleteId, 10);
    return this.adminService.deleteAdmin(adminPasswordDto.adminPassword, req.user.sub, parsedAdminToDeleteId)
  }
}
