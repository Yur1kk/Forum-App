import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'; 
import { PrismaService } from '../../prisma/prisma.service'; 
import { sub } from 'date-fns'; 
import { PostsService } from 'src/posts/posts.service'; 
import { UserService } from 'src/user/user.service';
import { FollowersService } from 'src/followers/followers.service';

interface Statistics {
  posts: { label: string; count: number }[]; 
  likes: { label: string; count: number }[]; 
  comments: { label: string; count: number }[]; 
}

@Injectable() 
export class StatisticsService {
  constructor(
    private prisma: PrismaService, 
    private postService: PostsService, 
    private userService: UserService,
    private followersService: FollowersService
  ) {}

  async getUserActivityStatistics(
    userId: number,
    startDate: Date,
    endDate: Date,
    interval: string,
    isAdmin: boolean
  ): Promise<any> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found!');
    }
  
    const statistics: Statistics = {
      posts: [],
      likes: [],
      comments: [],
    };
  
    const types = ['posts', 'likes', 'comments'];
    for (const statType of types) {
      const whereCondition = this.createWhereCondition(userId, null, statType, startDate, endDate, isAdmin);
      statistics[statType] = await this.fetchStatistics(statType, whereCondition, interval);
    }
  
    const followersCount = await this.followersService.countFollowers(userId);
    const followingCount = await this.followersService.countFollowing(userId);
  
    return { 
      userId, 
      startDate, 
      endDate, 
      statistics,
      followersCount,
      followingCount,
    };
  }
  

  async getPostActivityStatistics(
    postId: number,
    startDate: Date,
    endDate: Date,
    interval: string,
    isAdmin: boolean
  ) {
    const post = await this.postService.findPostById(postId);
    if (!post) {
      throw new NotFoundException('Post not found!');
    }
  
    const statistics = {};
    const types = ['likes', 'comments'];
    for (const statType of types) {
      const whereCondition = this.createWhereCondition(null, postId, statType, startDate, endDate, isAdmin);
      statistics[statType] = await this.fetchStatistics(statType, whereCondition, interval);
    }
  
    return { postId, startDate, endDate, statistics };
  }
  

  private createWhereCondition(
    userId: number | null,
    postId: number | null,
    type: string,
    startDate: Date,
    endDate: Date,
    isAdmin: boolean
  ) {
    const baseCondition = { createdAt: { gte: startDate, lte: endDate } };
  
    if (type === 'posts' && userId) {
      return { ...baseCondition, authorId: userId };
    }
    if (type === 'likes') {
      return { ...baseCondition, ...(userId && { userId }), ...(postId && { postId }) };
    }
    if (type === 'comments') {
      return { ...baseCondition, ...(userId && { userId }), ...(postId && { postId }) };
    }
    throw new BadRequestException('Invalid type.');
  }

  private async fetchStatistics(
    type: string,
    whereCondition: any,
    interval: string
  ) {
    let results;

    if (type === 'posts') {
      results = await this.prisma.post.findMany({
        where: whereCondition,
        select: { createdAt: true },
      });
    } else if (type === 'likes') {
      results = await this.prisma.likes.findMany({
        where: whereCondition,
        select: { createdAt: true },
      });
    } else if (type === 'comments') {
      results = await this.prisma.comments.findMany({
        where: whereCondition,
        select: { createdAt: true },
      });
    } else {
      throw new BadRequestException('Invalid type.');
    }

    return this.aggregateStatistics(results, interval);
  }

  private aggregateStatistics(results: { createdAt: Date }[], interval: string) {
    const aggregatedData = {};

    results.forEach(result => {
      const date = this.formatDateByInterval(result.createdAt, interval);
      aggregatedData[date] = (aggregatedData[date] || 0) + 1;
    });

    return Object.entries(aggregatedData).map(([label, count]) => ({ 
        label,
        count,
    }));
  }

  private formatDateByInterval(date: Date, interval: string): string {
    switch (interval) {
      case 'hour': return date.toISOString().slice(0, 13); 
      case 'day': return date.toISOString().slice(0, 10); 
      case 'week': {
        const startOfWeek = sub(date, { days: date.getDay() });
        return startOfWeek.toISOString().slice(0, 10); 
      }
      case 'month': return date.toISOString().slice(0, 7);
      default: throw new BadRequestException('Invalid interval.');
    }
  }
}
