import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotesEntity } from './../notes/entities/notes.entity';
import { NoteViewEntity } from './../notes/entities/note-view.entity';
import { NoteLikeEntity } from './../notes/entities/note-like.entity';
import { NoteCommentEntity } from './../notes/entities/note-comment.entity';
import { ProfileEntity } from './../profile/entities/profile.entity';
import { FollowEntity } from './../follow/entities/follow.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(NotesEntity)
    private notesRepo: Repository<NotesEntity>,
    @InjectRepository(NoteViewEntity)
    private viewsRepo: Repository<NoteViewEntity>,
    @InjectRepository(NoteLikeEntity)
    private likesRepo: Repository<NoteLikeEntity>,
    @InjectRepository(NoteCommentEntity)
    private commentsRepo: Repository<NoteCommentEntity>,
    @InjectRepository(ProfileEntity)
    private profilesRepo: Repository<ProfileEntity>,
    @InjectRepository(FollowEntity)
    private followsRepo: Repository<FollowEntity>, // 🔥 yangi qo‘shildi
  ) { }

  async getStats(userId: number) {
    const profile = await this.profilesRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      return { totalNotes: 0, totalViews: 0, totalLikes: 0, totalComments: 0, followersCount: 0, followingCount: 0 };
    }

    const notes = await this.notesRepo.find({
      where: { profile: { id: profile.id } },
    });
    const noteIds = notes.map((n) => n.id);

    const [totalViews, totalLikes, totalComments, followersCount, followingCount] =
      await Promise.all([
        this.viewsRepo.count({ where: { note: { id: In(noteIds) } } }),
        this.likesRepo.count({ where: { note: { id: In(noteIds) } } }),
        this.commentsRepo.count({ where: { note: { id: In(noteIds) } } }),
        this.followsRepo.count({ where: { following: { id: userId } } }), // meni kimlar kuzatyapti
        this.followsRepo.count({ where: { follower: { id: userId } } }),  // men kimnidir kuzatyapman
      ]);

    return {
      totalNotes: noteIds.length,
      totalViews,
      totalLikes,
      totalComments,
      followersCount,
      followingCount,
    };
  }

}
