import { Controller, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { StatisticsService } from './statistics.service';
import { PostsService } from 'src/posts/posts.service';
import { parse } from 'date-fns';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private statisticsService: StatisticsService,
    private postService: PostsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('user-activity')
  async getUserActivityStatistics(
    @Query('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: string,
    @Request() req,
  ) {
    const requesterId = req.user.sub;
    const roleId = req.user.roleId;
    const isAdmin = roleId === 2;


    const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
    const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());

   
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

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
      parsedStartDate,
      parsedEndDate,
      interval,
      isAdmin
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('post-activity')
  async getPostStatistics(
    @Query('postId') postId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
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

  
    const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
    const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());

  
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return this.statisticsService.getPostActivityStatistics(
      parsedPostId,
      parsedStartDate,
      parsedEndDate,
      interval,
      isAdmin
    );
  }
}
