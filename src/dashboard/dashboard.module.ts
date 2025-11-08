import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { NotesEntity } from './../notes/entities/notes.entity';
import { NoteViewEntity } from './../notes/entities/note-view.entity';
import { NoteLikeEntity } from './../notes/entities/note-like.entity';
import { NoteCommentEntity } from './../notes/entities/note-comment.entity';
import { ProfileEntity } from './../profile/entities/profile.entity';
import { FollowEntity } from './../follow/entities/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotesEntity,
      NoteViewEntity,
      NoteLikeEntity,
      NoteCommentEntity,
      ProfileEntity,
      FollowEntity
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule { }
