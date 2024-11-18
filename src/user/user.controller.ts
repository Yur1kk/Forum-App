import { Controller, Get, Param, ParseIntPipe, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PostsService } from '../posts/posts.service';
import { FollowersService } from '../followers/followers.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(
    private userService: UserService,
    private postsService: PostsService,
    private followersService: FollowersService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getUserInfo(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req
  ) {
    const currentUserId = req.user.sub;


    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }


    const posts = await this.postsService.getAllPosts(currentUserId, userId, 1, 10);


    const isFollowing = await this.followersService.isFollowing(currentUserId, userId);
    const isFollowed = await this.followersService.isFollowing(userId, currentUserId);


    return {
      user,
      posts,
      isFollowing,
      isFollowed,
    };
  }
}
