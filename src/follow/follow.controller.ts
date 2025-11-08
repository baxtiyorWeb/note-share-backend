
import { Controller, Post, Get, Param, Req, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-strategy/jwt-guards';
import { FollowService } from './follow.service';
import type { Request } from 'express';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) { }

  @Post("username/:username")
  async toggleFollowByUsername(
    @Param("username") username: string,
    @Req() req: Request
  ) {
    const followerId = req.user?.["sub"];
    return this.followService.toggleFollow(followerId, username);
  }



  @Get('followers/:userId')
  async getFollowers(@Param('userId', ParseIntPipe) userId: number) {
    return this.followService.getFollowers(userId);
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId', ParseIntPipe) userId: number) {
    return this.followService.getFollowing(userId);
  }

  @Get('count/:userId')
  async getCounts(@Param('userId', ParseIntPipe) userId: number) {
    const followers = await this.followService.countFollowers(userId);
    const following = await this.followService.countFollowing(userId);
    return { ...followers, ...following };
  }
}