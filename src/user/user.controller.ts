import { Controller, Post, UseGuards, Request, UploadedFile, UseInterceptors, Delete, Put, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer'

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('add-profile-photo')
  @UseInterceptors(FileInterceptor('profilePhoto', { storage: multer.memoryStorage() }))
  async addProfilePhoto(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const userId = req.user.sub;
    return this.userService.addUserPhoto(userId, file);
  }
  
  

  @UseGuards(JwtAuthGuard)
  @Delete('delete-profile-photo')
  async deleteProfilePhoto(@Request() req) {
    const userId = req.user.sub;
    return this.userService.deleteUserPhoto(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-profile-photo')
  @UseInterceptors(FileInterceptor('profilePhoto'))
  async updateProfilePhoto(@UploadedFile() file: Express.Multer.File, @Request() req) {
    const userId = req.user.sub;
    return this.userService.updateUserPhoto(userId, file);
  }
}
