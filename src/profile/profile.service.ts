import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProfileEntity } from './entities/profile.entity';
import { In, Repository } from 'typeorm';
import { UserEntity } from './../users/entities/user.entity';
import { NotesEntity } from './../notes/entities/notes.entity';
import { NoteLikeEntity } from './../notes/entities/note-like.entity';
import { NoteCommentEntity } from './../notes/entities/note-comment.entity';
import { NoteViewEntity } from './../notes/entities/note-view.entity';
import { SavedNoteEntity } from './../notes/entities/saved-note.entity';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfileEntity)
    private profileRepo: Repository<ProfileEntity>,
    @InjectRepository(NotesEntity)
    private noteRepo: Repository<NotesEntity>,
    @InjectRepository(NoteLikeEntity)
    private likeRepo: Repository<NoteLikeEntity>,
    @InjectRepository(NoteCommentEntity)
    private commentRepo: Repository<NoteCommentEntity>,
    @InjectRepository(NoteViewEntity)
    private viewRepo: Repository<NoteViewEntity>,
    @InjectRepository(SavedNoteEntity)
    private savedRepo: Repository<SavedNoteEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    // private notificationService: NotificationService,
    private notificationService: NotificationService,
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

  // PIN POST
  async pinNote(userId: number, noteId: number) {
    const profile = await this.ensureProfile(userId);
    const note = await this.noteRepo.findOne({ where: { id: noteId, profile: { id: profile.id } } });
    if (!note) throw new NotFoundException('Note not found or not yours');

    // Faqat 1 ta pin
    await this.profileRepo.update({ id: profile.id }, { pinnedNoteId: noteId });
    return { message: 'Pinned', noteId };
  }

  async unpinNote(userId: number) {
    const profile = await this.ensureProfile(userId);

    if (!profile.pinnedNoteId) {
      throw new BadRequestException('No pinned note to unpin');
    }
    await this.profileRepo.update({ id: profile.id }, { pinnedNoteId: undefined });
    return { message: 'Unpinned' };
  }

  // CUSTOM LINKS
  async updateLinks(userId: number, links: { title: string; url: string }[]) {
    if (links.length > 3) throw new BadRequestException('Max 3 links');
    const profile = await this.ensureProfile(userId);
    profile.customLinks = links;
    return this.profileRepo.save(profile);
  }

  // THEME
  async updateTheme(userId: number, theme: any) {
    const profile = await this.ensureProfile(userId);
    profile.theme = { ...profile.theme, ...theme };
    return this.profileRepo.save(profile);
  }

  // PREMIUM
  async togglePremium(userId: number) {
    const profile = await this.ensureProfile(userId);
    profile.isPremium = !profile.isPremium;
    return this.profileRepo.save(profile);
  }

  // TIP SYSTEM
  async sendTip(senderId: number, receiverId: number, amount: number) {
    const [sender, receiver] = await Promise.all([
      this.ensureProfile(senderId),
      this.profileRepo.findOne({ where: { id: receiverId } }),
    ]);

    if (!receiver) throw new NotFoundException('Receiver not found');

    if (!receiver.allowTips) throw new BadRequestException('Tips disabled');
    if (amount < 1) throw new BadRequestException('Min 1$');

    receiver.tipBalance = (parseFloat(receiver.tipBalance) + amount).toFixed(2);
    await this.profileRepo.save(receiver);

    await this.notificationService.create(
      'SHARE',
      sender.id,
      receiver.id,
      undefined,
      `${sender.username} sent $${amount} tip!`,
    );

    return { message: 'Tip sent', amount };
  }

  // ANALYTICS
  async getAnalytics(userId: number) {
    const profile = await this.ensureProfile(userId);
    const [views, likes, comments] = await Promise.all([
      this.viewRepo.count({ where: { viewer: { id: profile.id } } }),
      this.likeRepo.count({ where: { profile: { id: profile.id } } }),
      this.commentRepo.count({ where: { author: { id: profile.id } } }),
    ]);

    const growth = await this.getGrowthData(profile.id);

    return { views, likes, comments, growth };
  }

  private async getGrowthData(profileId: number) {
    // So‘nggi 7 kun
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const views = await this.viewRepo
      .createQueryBuilder('v')
      .select("DATE(v.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('v.viewerId = :id', { id: profileId })
      .andWhere('v.createdAt >= :date', { date: sevenDaysAgo })
      .groupBy('DATE(v.createdAt)')
      .getRawMany();

    return views;
  }

  // AI SUMMARY (Mock)
  async generateAISummary(userId: number) {
    const profile = await this.ensureProfile(userId);
    const notes = await this.noteRepo.find({ where: { profile: { id: profile.id } }, take: 5 });

    // AI chaqirish (mock)
    const summary = `Top writer in ${notes[0]?.tags || 'tech'}. ${notes.length} posts, 50k+ views.`;

    profile.bioSummary = summary;
    await this.profileRepo.save(profile);
    return { summary };
  }

  // EXPORT
  async exportProfile(userId: number) {
    const profile = await this.getOwnerProfile(userId);
    const data = JSON.stringify(profile, null, 2);
    return { data, filename: `${profile?.profile?.username}-profile.json` };
  }



  async updateProfile(id: number, profileData: Partial<ProfileEntity>) {
    try {
      if (!id) throw new BadRequestException("id not submitting");

      const user = await this.userRepo.findOne({
        where: { id },
        relations: ['profile']
      });

      if (!user) throw new NotFoundException("User not found");

      // 🔹 Username conflict check
      if (profileData.username) {
        const existUsername = await this.profileRepo.findOne({
          where: { username: profileData.username },
        });

        if (existUsername && existUsername.userId !== id) {
          throw new ConflictException('This username is already taken');
        }
      }

      // 🔹 Har ehtimolga qarshi profilni to‘g‘ridan-to‘g‘ri tekshiramiz
      let profile = await this.profileRepo.findOne({ where: { userId: user.id } });

      // Agar bazada profil mavjud bo‘lmasa — yangi yaratamiz
      if (!profile) {
        profile = this.profileRepo.create({
          user,
          userId: user.id,
          ...profileData,
        });

        try {
          return await this.profileRepo.save(profile);
        } catch (err) {
          // Parallel request yoki duplicate holatni tutish
          if (err.code === '23505') {
            profile = await this.profileRepo.findOne({ where: { userId: user.id } });
          } else {
            throw err;
          }
        }
      }
      if (!profile) {
        throw new InternalServerErrorException('Profile could not be loaded');
      }
      Object.assign(profile, profileData);
      return await this.profileRepo.save(profile);

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

  async getBySlug(slug: string, viewerId?: number) {
    const profile = await this.profileRepo.findOne({
      where: { slug },
      relations: ['notes', 'followers', 'following'],
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.withStats(profile, viewerId);
  }

  async follow(followerId: number, followingId: number) {
    const [follower, following] = await Promise.all([
      this.ensureProfile(followerId),
      this.profileRepo.findOne({ where: { id: followingId }, relations: ['followers'] }),
    ]);

    if (!following) throw new NotFoundException('User not found');
    if (follower.id === following.id) throw new BadRequestException('Cannot follow yourself');

    if (following.followers?.some((f) => f.id === follower.id))
      throw new ConflictException('Already following');

    following.followers = [...(following.followers || []), follower];
    await this.profileRepo.save(following);
    return { message: 'Followed', following: true };
  }

  async unfollow(followerId: number, followingId: number) {
    const following = await this.profileRepo.findOne({
      where: { id: followingId },
      relations: ['followers'],
    });
    if (!following) throw new NotFoundException('User not found');

    following.followers = following.followers.filter((f) => f.id !== followerId);
    await this.profileRepo.save(following);
    return { message: 'Unfollowed', following: false };
  }

  async getFollowers(userId: number) {
    const profile = await this.ensureProfile(userId);
    const full = await this.profileRepo.findOne({
      where: { id: profile.id },
      relations: ['followers'],
    });
    if (!full) throw new NotFoundException('Profile not found');
    return full.followers.map((p) => this.withStats(p));
  }
  async getFollowing(userId: number) {
    const profile = await this.ensureProfile(userId);
    const full = await this.profileRepo.findOne({
      where: { id: profile.id },
      relations: ['following'],
    });
    if (!full) throw new NotFoundException('Profile not found');
    return full.following.map((p) => this.withStats(p));
  }


  // === TABS ===
  async getMyPosts(userId: number) {
    const profile = await this.ensureProfile(userId);
    return this.noteRepo.find({
      where: { profile: { id: profile.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async getSaved(userId: number) {
    const profile = await this.ensureProfile(userId);
    const saved = await this.savedRepo.find({
      where: { profile: { id: profile.id } },
      relations: ['note'],
    });
    return saved.map((s) => s.note);
  }
  async getLiked(userId: number) {
    const profile = await this.ensureProfile(userId);
    const likes = await this.likeRepo.find({
      where: { profile: { id: profile.id } },
      relations: ['note'],
    });
    return likes.map((l) => l.note);
  }

  // === STATS ===
  async getStats(userId: number) {
    const profile = await this.ensureProfile(userId);
    const [notes, likes, comments, views] = await Promise.all([
      this.noteRepo.count({ where: { profile: { id: profile.id } } }),
      this.likeRepo.count({ where: { profile: { id: profile.id } } }),
      this.commentRepo.count({ where: { author: { id: profile.id } } }),
      this.viewRepo.count({ where: { viewer: { id: profile.id } } }),
    ]);

    const followers = await this.profileRepo.count({ where: { following: In([profile.id]) } });
    const following = await this.profileRepo.count({ where: { followers: In([profile.id]) } });

    const engagement = notes > 0 ? ((likes + comments) / notes).toFixed(2) : '0';

    return { posts: notes, likes, comments, views, followers, following, engagement };
  }

  private async withStats(profile: ProfileEntity, viewerId?: number) {
    const stats = await this.getStats(profile.userId);
    const isFollowing = viewerId
      ? (await this.profileRepo.findOne({
        where: { id: viewerId, following: In([profile.id]) },
      }))
        ? true
        : false
      : false;

    return { ...profile, stats, isFollowing };
  }

  // === ACTIVITY ===
  async getActivity(userId: number) {
    const profile = await this.ensureProfile(userId);
    const [posts, likes, comments] = await Promise.all([
      this.noteRepo.find({ where: { profile: { id: profile.id } }, take: 5, order: { createdAt: 'DESC' } }),
      this.likeRepo.find({ where: { profile: { id: profile.id } }, relations: ['note'], take: 5 }),
      this.commentRepo.find({ where: { author: { id: profile.id } }, relations: ['note'], take: 5 }),
    ]);

    return [
      ...posts.map((p) => ({ type: 'post', data: p, at: p.createdAt })),
      ...likes.map((l) => ({ type: 'like', data: l.note, at: l.createdAt })),
      ...comments.map((c) => ({ type: 'comment', data: { note: c.note, text: c.text }, at: c.createdAt })),
    ].sort((a, b) => +b.at - +a.at);
  }



  // === HELPER ===
  private async ensureProfile(userId: number): Promise<ProfileEntity> {
    let profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      const username = `user_${userId}_${Math.random().toString(36).substr(2, 5)}`;
      profile = this.profileRepo.create({ userId, username, slug: username });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }
}
