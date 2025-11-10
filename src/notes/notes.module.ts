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

@Module({
  imports: [TypeOrmModule.forFeature([
    NotesEntity,
    ProfileEntity,
    UserEntity,
    NoteViewEntity,
    NoteLikeEntity,
    NoteCommentEntity,
  ]), ScheduleModule.forRoot(),],
  controllers: [NotesController, NoteInteractionsController],
  providers: [NotesService, NoteInteractionsService, ReminderService, OneSignalService, UsersService],
})
export class NotesModule { }
