import { Body, Controller, Delete, Get, Param, Patch, Put, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/jwt-guard';
import { ProfileService } from './profile.service';
import type { Request } from 'express';

@Controller('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService
  ) { }

  @Get('/me')
  async getOwnerProfile(@Req() req: Request) {

    const id = req.user?.['sub']

    const user = this.profileService.getOwnerProfile(id)

    return user
  }

  @Get(':username')
  async getByUsername(@Param('username') username: string) {
    return this.profileService.getByUsername(username);
  }

  @Put('/update')
  async updateProfile(@Req() req: Request, @Body() profileData: any) {
    const id = req.user?.['sub'];
    if (!id) {
      throw new Error('Unauthorized: user ID not found in token');
    }

    const updatedProfile = await this.profileService.updateProfile(id, profileData);

    return {
      message: 'Profile updated successfully',
      data: updatedProfile,
    };
  }

  @Patch('/update')
  async updateProfilePatch(@Req() req: Request, @Body() profileData: any) {
    const id = req.user?.['sub'];
    if (!id) {
      throw new Error('Unauthorized: user ID not found in token');
    }
    const updatedProfile = await this.profileService.updateProfile(id, profileData);

    return {
      message: 'Profile updated successfully',
      data: updatedProfile,
    };
  }


  @Delete('/delete')
  async deleteProfile(@Req() req: Request) {
    const id = req.user?.['sub'];
    if (!id) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return await this.profileService.deleteProfile(id);
  }


}
