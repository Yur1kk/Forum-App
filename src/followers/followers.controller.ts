import { Controller, Post, Delete, Get, Param, Request, ParseIntPipe, UseGuards, Head } from '@nestjs/common';
import { FollowersService } from './followers.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';

@Controller('followers')
export class FollowersController {
  constructor(private followersService: FollowersService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':followedId')
  async follow(@Request() req, @Param('followedId', ParseIntPipe) followedId: number) {
    const followerId = req.user.sub; 
    return this.followersService.followUser(followerId, followedId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':followedId')
  async unfollow(@Request() req, @Param('followedId', ParseIntPipe) followedId: number) {
    const followerId = req.user.sub;
    return this.followersService.unfollowUser(followerId, followedId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/followers')
  async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    return this.followersService.getFollowers(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/following')
  async getFollowing(@Param('userId', ParseIntPipe) userId: number) {
    return this.followersService.getFollowing(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Head(':userId/followers/count')
  async countFollowers(@Param('userId', ParseIntPipe) userId: number) {
    const followersCount = await this.followersService.countFollowers(userId);
    return { 'X-Followers-Count': followersCount }; 
  }

  @UseGuards(JwtAuthGuard)
  @Head(':userId/following/count')
  async countFollowing(@Param('userId', ParseIntPipe) userId: number) {
    const followingCount = await this.followersService.countFollowing(userId);
    return { 'X-Following-Count': followingCount }; 
  }
}
