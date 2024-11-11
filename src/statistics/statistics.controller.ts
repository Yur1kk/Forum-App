import { Controller, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { StatisticsService } from './statistics.service';
import { PostsService } from 'src/posts/posts.service';

@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService, private postService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('user-activity')
  async getUserActivityStatistics(
    @Query('userId') userId: string,
    @Query('period') period: string,
    @Query('interval') interval: string,
    @Request() req,
  ) {
    const requesterId = req.user.sub;  
    const roleId = req.user.roleId;  
    const isAdmin = roleId === 2;

    let targetUserId: number;

    if (userId) {
      const parsedUserId = parseInt(userId, 10);  
      if (isNaN(parsedUserId)) {
        throw new BadRequestException('Invalid userId');
      }
      targetUserId = isAdmin ? parsedUserId : requesterId;
    } else {
      targetUserId = requesterId;
    }

    if (!targetUserId || isNaN(targetUserId)) {
      throw new BadRequestException('Invalid userId');
    }

    return this.statisticsService.getUserActivityStatistics(
      targetUserId,
      period,
      interval,
      isAdmin
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('post-activity')
  async getPostStatistics(
    @Query('postId') postId: string,
    @Query('period') period: string,
    @Query('interval') interval: string,
    @Request() req,
  ) {
    const requesterId = req.user.sub;  
    const roleId = req.user.roleId;  
    const isAdmin = roleId === 2;

    const parsedPostId = postId ? parseInt(postId, 10) : null;
    if (!isAdmin && parsedPostId !== null) {
      const post = await this.postService.findPostById(parsedPostId);
      if (post.authorId !== requesterId) {
        throw new BadRequestException('You are not the author of this post');
      }
    }

    return this.statisticsService.getPostActivityStatistics(parsedPostId, period, interval, isAdmin);
  }
}
