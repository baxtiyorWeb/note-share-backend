import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotesEntity } from 'src/notes/entities/notes.entity';
import { NoteViewEntity } from 'src/notes/entities/note-view.entity';
import { NoteLikeEntity } from 'src/notes/entities/note-like.entity';
import { NoteCommentEntity } from 'src/notes/entities/note-comment.entity';
import { ProfileEntity } from 'src/profile/entities/profile.entity';

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
  ) { }

  async getStats(userId: number) {
    const profile = await this.profilesRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!profile) {
      return { totalNotes: 0, totalViews: 0, totalLikes: 0, totalComments: 0 };
    }

    const notes = await this.notesRepo.find({
      where: { profile: { id: profile.id } },
    });
    const noteIds = notes.map((n) => n.id);

    if (!noteIds.length) {
      return { totalNotes: 0, totalViews: 0, totalLikes: 0, totalComments: 0 };
    }

    const [totalViews, totalLikes, totalComments] = await Promise.all([
      this.viewsRepo.count({ where: { note: { id: In(noteIds) } } }),
      this.likesRepo.count({ where: { note: { id: In(noteIds) } } }),
      this.commentsRepo.count({ where: { note: { id: In(noteIds) } } }),
    ]);

    return {
      totalNotes: noteIds.length,
      totalViews,
      totalLikes,
      totalComments,
    };
  }
}
