import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { NotesEntity } from 'src/notes/entities/notes.entity';
import { NoteViewEntity } from 'src/notes/entities/note-view.entity';
import { NoteLikeEntity } from 'src/notes/entities/note-like.entity';
import { NoteCommentEntity } from 'src/notes/entities/note-comment.entity';
import { ProfileEntity } from 'src/profile/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotesEntity,
      NoteViewEntity,
      NoteLikeEntity,
      NoteCommentEntity,
      ProfileEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule { }
