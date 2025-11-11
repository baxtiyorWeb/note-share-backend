import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, Req } from '@nestjs/common';
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
    if (!id) throw new BadRequestException('ID is required');

    const user = await this.userRepo.findOne({
      where: { id },
      relations: [
        'profile',
        'followers',
        'followers.follower',
        'followers.follower.profile',
        'following',
        'following.following',
        'following.following.profile',
        'profile.notes',
      ],
    });

    if (!user) throw new NotFoundException('User not found');


    let profile = await this.profileRepo.findOne({ where: { userId: user.id } });

    if (!profile) {
      try {
        const username = `user_${user.id}_${Math.floor(Math.random() * 10000)}`;
        const newProfile = this.profileRepo.create({
          user,
          userId: user.id,
          username,
          firstName: 'User',
          lastName: 'Name',
        });
        profile = await this.profileRepo.save(newProfile);
        user.profile = profile;
        await this.userRepo.save(user);
      } catch (err) {

        if (err.code === '23505') {
          profile = await this.profileRepo.findOne({ where: { userId: user.id } });
        } else {
          throw new InternalServerErrorException('Profile creation failed: ' + err.message);
        }
      }
    }


    const cleaned = {
      id: user.id,
      email: user.email,
      profile: profile && {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        avatar: profile.avatar,
        coverImage: profile.coverImage,
        notes: profile.notes?.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          isPublic: n.isPublic,
        })),
      },
      followers:
        user.followers?.map((f) => ({
          id: f.id,
          createdAt: f.createdAt,
          profile: f.follower?.profile && {
            id: f.follower.profile.id,
            username: f.follower.profile.username,
            firstName: f.follower.profile.firstName,
            lastName: f.follower.profile.lastName,
            avatar: f.follower.profile.avatar,
          },
        })) ?? [],
      following:
        user.following?.map((f) => ({
          id: f.id,
          createdAt: f.createdAt,
          profile: f.following?.profile && {
            id: f.following.profile.id,
            username: f.following.profile.username,
            firstName: f.following.profile.firstName,
            lastName: f.following.profile.lastName,
            avatar: f.following.profile.avatar,
          },
        })) ?? [],
    };

    return cleaned;
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

  async getUserProfile(username: string, requesterId?: number) {
    const profile = await this.profileRepo.findOne({
      where: { username },
      relations: ['user', 'notes'],
    });

    if (!profile) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const isOwner = requesterId === profile.user.id;

    const filteredNotes = profile.notes.filter(
      (note) => isOwner || note.isPublic === true,
    );

    return {
      id: profile.id,
      username: profile.username,
      avatar: profile.avatar,
      coverImage: profile.coverImage,
      user: {
        id: profile.user.id,
        username: profile.username,
        email: isOwner ? profile.user.email : undefined,
      },
      notes: filteredNotes,
    };
  }



  async updateProfile(id: number, profileData: Partial<ProfileEntity>) {
    try {
      if (!id) {
        throw new BadRequestException("id not submitting");
      }

      const user = await this.userRepo.findOne({
        where: { id },
        relations: ['profile']
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      if (profileData.username) {
        const existUsername = await this.profileRepo.findOne({
          where: { username: profileData.username },
        });

        if (existUsername && existUsername.userId !== id) {
          throw new ConflictException('This username is already taken');
        }
      }

      if (!user.profile) {
        const newProfile = this.profileRepo.create({
          user,
          userId: user.id,
          ...profileData,
        });

        return await this.profileRepo.save(newProfile);
      }

      // 🔹 Aks holda mavjud profilni yangilaymiz
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
