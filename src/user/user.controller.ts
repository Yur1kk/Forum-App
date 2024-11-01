import { Controller, Post, UseGuards, Request, Body, Delete, Put} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { ProfilePhotoDto } from './dto/profile-photo.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Post('add-profile-photo')
  async addProfilePhoto(@Body() profilePhotoDto: ProfilePhotoDto, @Request() req) {
     const userId = req.user.sub;
      return this.userService.addUserPhoto(userId, profilePhotoDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-profile-photo')
  async deleteProfilePhoto(@Request() req) {
     const userId = req.user.sub;
     return this.userService.deleteUserPhoto(userId);
  }
  @UseGuards(JwtAuthGuard)
  @Put('update-profile-photo')
  async updateProfilePhoto(@Body() profilePhotoDto: ProfilePhotoDto, @Request() req) {
    const userId = req.user.sub;
      return this.userService.updateUserPhoto(userId, profilePhotoDto);
  }
}


