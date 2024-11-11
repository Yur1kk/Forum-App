import { Controller, Param, Body, Put, UseGuards, Request, Post } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';

@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLikePost(@Param('id') postId:string, @Request() req) {
    const userId = req.user.sub;
    const postIdInt = parseInt(postId, 10);
    return this.likesService.toggleLikePost(userId, postIdInt);
  }
}
