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

    const { user, isFollowing, isFollowed } = await this.userService.getUserInfoWithFollowStatus(currentUserId, userId);

    const posts = await this.postsService.getAllPosts(currentUserId, userId, 1, 10);

    return {
      user: {
        id: user.id,
        name: user.name,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt,
      },
      isFollowing,
      isFollowed,
      posts,
    };
  }
}
