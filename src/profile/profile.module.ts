// src/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { ProfileController } from './profile.controller';

// Services
import { ProfileService } from './profile.service';

// Entities
import { ProfileEntity } from './entities/profile.entity';
import { UserEntity } from '../users/entities/user.entity';
import { NotesEntity } from '../notes/entities/notes.entity';
import { SavedNoteEntity } from '../notes/entities/saved-note.entity';
import { NoteLikeEntity } from '../notes/entities/note-like.entity';
import { NoteCommentEntity } from '../notes/entities/note-comment.entity';
import { NoteViewEntity } from '../notes/entities/note-view.entity';
import { NoteReactionEntity } from '../notes/entities/note-reaction.entity';

// Modules
import { NotesModule } from '../notes/notes.module';
import { UploadService } from '../file/uploadService';
import { NotificationEntity } from './../notification/entities/notification.entity';
import { NotificationService } from './../notification/notification.service';

@Module({
  imports: [
    // TypeORM: Barcha kerakli entitylar
    TypeOrmModule.forFeature([
      ProfileEntity,
      UserEntity,
      NotesEntity,
      SavedNoteEntity,
      NoteLikeEntity,
      NoteCommentEntity,
      NoteViewEntity,
      NoteReactionEntity,
      NotificationEntity,
    ]),

    // Boshqa modullar (NoteInteractionsService uchun)
    NotesModule,
  ],

  // Controller
  controllers: [ProfileController],

  // Providers
  providers: [
    ProfileService,
    UploadService, // Avatar & Cover upload uchun
    NotificationService
  ],

  // Eksport: Boshqa modullar (masalan, NotesService) ishlatishi uchun
  exports: [
    ProfileService,
    TypeOrmModule,
  ],
})
export class ProfileModule { }