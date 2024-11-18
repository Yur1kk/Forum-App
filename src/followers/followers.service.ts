import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FollowersService {
  constructor(private prisma: PrismaService) {}

  async followUser(followerId: number, followedId: number) {
    if (followerId === followedId) {
      throw new BadRequestException('You cannot follow yourself.');
    }

    const existingFollow = await this.prisma.follower.findUnique({
      where: { followerId_followedId: { followerId, followedId } },
    });

    if (existingFollow) {
      throw new BadRequestException('You are already following this user.');
    }

    return this.prisma.follower.create({
      data: { followerId, followedId },
    });
  }

  async unfollowUser(followerId: number, followedId: number) {
    return this.prisma.follower.delete({
      where: { followerId_followedId: { followerId, followedId } },
    });
  }

  async getFollowers(userId: number) {
    return this.prisma.follower.findMany({
      where: { followedId: userId },
      select: { follower: true }, 
    });
  }

  async getFollowing(userId: number) {
    return this.prisma.follower.findMany({
      where: { followerId: userId },
      select: { followed: true }, 
    });
  }

  async countFollowers(userId: number) {
    return this.prisma.follower.count({ where: { followedId: userId } });
  }

  async countFollowing(userId: number) {
    return this.prisma.follower.count({ where: { followerId: userId } });
  }

  async isFollowing(followerId: number, followedId: number) {
    const follow = await this.prisma.follower.findUnique({
      where: { followerId_followedId: { followerId, followedId } },
    });
    return follow ? true : false;
  }

  async isFollowed(followerId: number, followedId: number) {
    const follow = await this.prisma.follower.findUnique({
      where: { followerId_followedId: { followerId: followedId, followedId: followerId } },
    });
    return follow ? true : false;
  }
}
