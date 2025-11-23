// src/payment/payment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { NotesModule } from '../notes/notes.module';
import { StripeService } from './stripe.service';
import { NotesService } from './../notes/notes.service';
import { NotesEntity } from './../notes/entities/notes.entity';
import { ProfileEntity } from './../profile/entities/profile.entity';
import { UserEntity } from './../users/entities/user.entity';
import { SavedNoteEntity } from './../notes/entities/saved-note.entity';
import { NoteLikeEntity } from './../notes/entities/note-like.entity';
import { NoteViewEntity } from './../notes/entities/note-view.entity';
import { NoteCommentEntity } from './../notes/entities/note-comment.entity';
import { NoteExportEntity } from './../notes/entities/note-export.entity';
import { ReminderService } from './../notes/reminder.service';
import { ExportService } from './../export/export.service';
import { AiService } from './../notification/ai.service';
import { NotificationService } from './../notification/notification.service';
import { OneSignalService } from './../onesignal/onesignal.service';
import { UsersService } from './../users/users.service';
import { UploadService } from './../file/uploadService';
import { NotificationEntity } from './../notification/entities/notification.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity,
      NotesEntity, ProfileEntity, UserEntity, SavedNoteEntity, NoteLikeEntity, NoteViewEntity,
      NoteLikeEntity, NoteCommentEntity, NoteExportEntity, NotificationEntity]),



    NotesModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, StripeService, UsersService, UploadService, OneSignalService, NotesService, ReminderService, ExportService, AiService, NotificationService],
  exports: [PaymentService, StripeService,],
})
export class PaymentModule { }