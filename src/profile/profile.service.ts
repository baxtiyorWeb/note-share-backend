import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { Repository } from 'typeorm';
import { UserEntity } from './../users/entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
  ) { }


  async getOwnerProfile(id: number) {


    try {
      if (id == null) {
        throw new BadRequestException("id not getting");
      }

      const user = await this.userRepo.findOne({ where: { id }, relations: ['profile'] });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      if (!user.profile) {

        const newProfile = this.profileRepo.create({ user });
        await this.profileRepo.save(newProfile)

        user.profile = newProfile;
        await this.userRepo.save(user)
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('User not loaded', error);
    }
  }

  async getByUsername(username: string) {
    const profile = await this.profileRepo.findOne({
      where: { username },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    return profile;
  }


  async updateProfile(id: number, profileData: Partial<ProfileEntity>) {
    try {
      if (!id) {
        throw new BadRequestException("id not submitting");
      }

      const user = await this.userRepo.findOne({
        where: { id },
        relations: ['profile']
      })

      if (!user) {
        throw new NotFoundException("User not found");
      }

      if (!user.profile) {
        const newProfile = this.profileRepo.create({ user, ...profileData });

        return await this.profileRepo.save(newProfile)
      }

      const updateProfile = Object.assign(user.profile, profileData);

      return await this.profileRepo.save(updateProfile);

    } catch (error) {
      throw new InternalServerErrorException('Profile update failed: ' + error.message);
    }
  }

  async deleteProfile(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepo.remove(user); // profile ham o‘chadi (cascade bo‘lsa)

    return { message: 'User and profile deleted successfully' };
  }




}
