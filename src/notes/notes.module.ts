import { NoteViewEntity } from "./entities/note-view.entity";
import { NoteLikeEntity } from "./entities/note-like.entity";
import { NoteCommentEntity } from "./entities/note-comment.entity";
import { NoteInteractionsService } from "./note-interactions.service";
import { NoteInteractionsController } from "./note-interactions.controller";
import { NotesEntity } from "./entities/notes.entity";
import { ProfileEntity } from "./../profile/entities/profile.entity";
import { UserEntity } from "./../users/entities/user.entity";
import { NotesController } from "./notes.controller";
import { NotesService } from "./notes.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ReminderService } from "./reminder.service";
import { OneSignalService } from "./../onesignal/onesignal.service";
import { UsersService } from "./../users/users.service";
import { SavedNoteEntity } from "./entities/saved-note.entity";
import { NoteExportEntity } from "./entities/note-export.entity";
import { PaymentEntity } from "./../payment/entities/payment.entity";
import { ExportService } from "./../export/export.service";
import { AiService } from "./../notification/ai.service";
import { NotificationService } from "./../notification/notification.service";
import { UploadService } from "./../file/uploadService";
import { NotificationEntity } from "./../notification/entities/notification.entity";

@Module({
  imports: [TypeOrmModule.forFeature([
    NotesEntity,
    ProfileEntity,
    UserEntity,
    NoteViewEntity,
    NoteLikeEntity,
    NoteCommentEntity,
    SavedNoteEntity,
    NoteExportEntity,
    PaymentEntity,
    NotificationEntity,
  ]), ScheduleModule.forRoot(),],
  controllers: [NotesController, NoteInteractionsController],
  providers: [NotesService, NoteInteractionsService, UploadService, ExportService, AiService, NotificationService, ReminderService, OneSignalService, UsersService],
})
export class NotesModule { }
