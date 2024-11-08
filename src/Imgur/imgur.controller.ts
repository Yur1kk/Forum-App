import { Controller, Post, UseGuards, Request, UploadedFile, UseInterceptors, Delete, Put, BadRequestException, Param, Req, ParseIntPipe, Patch } from '@nestjs/common';
import { ImgurService } from './imgur.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer'

@Controller('imgur')
export class ImgurController {
    constructor(private imgurService: ImgurService) {}

@UseGuards(JwtAuthGuard)
@Post('add-profile-photo')
@UseInterceptors(FileInterceptor('profilePhoto', { storage: multer.memoryStorage() }))
async addProfilePhoto(@UploadedFile() file: Express.Multer.File, @Request() req) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  const userId = req.user.sub;
  return this.imgurService.addUserPhoto(userId, file);
}



@UseGuards(JwtAuthGuard)
@Delete('delete-profile-photo')
async deleteProfilePhoto(@Request() req) {
  const userId = req.user.sub;
  return this.imgurService.deleteUserPhoto(userId);
}

@UseGuards(JwtAuthGuard)
@Put('update-profile-photo')
@UseInterceptors(FileInterceptor('profilePhoto', { storage: multer.memoryStorage() }))
async updateUserPhoto(@UploadedFile() file: Express.Multer.File, @Request() req) {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  const userId = req.user.sub;
  return this.imgurService.updateUserPhoto(userId, file);
}

@UseGuards(JwtAuthGuard)
  @Post(':postId/add-image')
  @UseInterceptors(FileInterceptor('postImage'))
  async addPostImage(
    @Param('postId', ParseIntPipe) postId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req
  ) {
    const userId = req.user.sub;
    return this.imgurService.addPostImage(postId, file, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':postId/update-image')
  @UseInterceptors(FileInterceptor('postImage'))
  async updatePostImage(
    @Param('postId', ParseIntPipe) postId: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req
  ) {
    const userId = req.user.sub;
    return this.imgurService.updatePostImage(postId, file, userId);
  }

  @UseGuards(JwtAuthGuard)
   @Delete(':postId/delete-image')
   async deletePostImage(@Param('postId') postId: string, @Request() req) {
    const userId = req.user.sub;
    const postIdInt = parseInt(postId, 10);
    return this.imgurService.deletePostImage(postIdInt, userId);
}
}