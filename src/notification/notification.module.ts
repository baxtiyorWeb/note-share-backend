import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationEntity } from "./entities/notification.entity";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { ProfileEntity } from "../profile/entities/profile.entity";
import { NotesEntity } from "../notes/entities/notes.entity";

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity, ProfileEntity, NotesEntity])],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule { }
