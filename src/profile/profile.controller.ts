import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-strategy/jwt-guards';
import { ProfileService } from './profile.service';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './../file/uploadService';

@Controller('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly uploadService: UploadService
  ) { }

  @Post('/upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const id = req.user?.['sub'];
    if (!id) throw new Error('Unauthorized');

    const avatarUrl = await this.uploadService.uploadFile(file);

    const updatedProfile = await this.profileService.updateProfile(id, { avatar: avatarUrl });

    return {
      message: 'Avatar successfully uploaded',
      avatarUrl,
      profile: updatedProfile,
    };
  }

  @Post('/upload-cover-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async uploadCoverImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const id = req.user?.['sub'];
    if (!id) {
      throw new Error('Unauthorized: user ID not found in token');
    }

    // 1️⃣ Faylni Vercel Blob ga yuklash
    const coverUrl = await this.uploadService.uploadFile(file);

    // 2️⃣ Profile jadvaliga URL yozish
    const updatedProfile = await this.profileService.updateProfile(id, {
      coverImage: coverUrl,
    });

    // 3️⃣ Natijani qaytarish
    return {
      message: 'Cover image uploaded successfully ✅',
      coverUrl,
      profile: updatedProfile,
    };
  }


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
